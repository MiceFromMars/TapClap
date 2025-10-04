const { ccclass, property } = cc._decorator;
import { ITile, IPosition, IBoardConfig, IAnimationConfig, Pos } from "./types";
import { ITileView } from "./interfaces/ITileView";
import { IEventBus } from "./interfaces/IEventBus";
import { GameEvents, IBoardAnimationEvent } from "./GameEvents";
import { IBoardView } from "./interfaces/IBoardView";
import { IAnimationController } from "./interfaces/IAnimationController";
import TileView from "./TileView";

export class DefaultAnimationController implements IAnimationController {
  constructor(private readonly _config: IAnimationConfig) {}

  async playBurnAnimation(tileViews: ITileView[]): Promise<void> {
    const animations = tileViews.map(tileView => tileView.playBurnAnimation());
    await Promise.all(animations);
  }

  async playDropAnimation(tileViews: ITileView[], targetPositions: IPosition[]): Promise<void> {
    const animations = tileViews.map((tileView, index) => {
      const targetPosition = targetPositions[index];
      const worldPosition = this._getWorldPosition(targetPosition);
      return tileView.playDropAnimation(worldPosition);
    });
    await Promise.all(animations);
  }

  async playRefillAnimation(tileViews: ITileView[], startPositions: IPosition[], targetPositions: IPosition[]): Promise<void> {
    const animations = tileViews.map((tileView, index) => {
      const startPosition = startPositions[index];
      const targetPosition = targetPositions[index];
      const startWorldPos = this._getWorldPosition(startPosition);
      const targetWorldPos = this._getWorldPosition(targetPosition);
      
      // Set initial position
      tileView.setPosition(startPosition);
      
      return tileView.playDropAnimation(targetWorldPos, this._config.refillDelay);
    });
    await Promise.all(animations);
  }

  private _getWorldPosition(position: IPosition): cc.Vec2 {
    const x = position.column * 72; // Default cell size
    const y = -position.row * 72;
    return cc.v2(x, y);
  }
}

@ccclass
export default class BoardView extends cc.Component implements IBoardView {
  @property(cc.Prefab) tilePrefab: cc.Prefab = null;
  @property(cc.Node) gridParent: cc.Node = null;
  @property(cc.Float) cellSize: number = 72;
  @property(cc.Float) refillDelay: number = 0.05;

  private _tiles: (ITileView | null)[][] = [];
  private _config: IBoardConfig;
  private _eventBus: IEventBus;
  private _animationController: IAnimationController;

  onLoad() {
    this._setupEventListeners();
  }

  onDestroy() {
    this._removeEventListeners();
  }

  initialize(eventBus: IEventBus, config: IBoardConfig): void {
    this._eventBus = eventBus;
    this._config = config;
    this._animationController = new DefaultAnimationController({
      burnDuration: 0.18,
      dropDuration: 0.28,
      refillDelay: this.refillDelay
    });
  }

  setConfig(config: IBoardConfig): void {
    this._config = config;
  }

  initializeFromSnapshot(snapshot: (ITile | null)[][]): void {
    this._clearGrid();
    this._createTilesFromSnapshot(snapshot);
  }

  async animateBurnAndCollapse(positions: IPosition[], newSnapshot: (ITile | null)[][]): Promise<void> {
    // Convert IPosition[] to Pos[] for internal processing
    const group: Pos[] = positions.map(p => ({ r: p.row, c: p.column }));
    
    this._eventBus.publish(GameEvents.BOARD_ANIMATION_STARTED, {
      animationType: "burn",
      positions
    });

    // 1) burn
    const burns: Promise<void>[] = [];
    for (const p of group) {
      const tv = this._tiles[p.r][p.c];
      if (tv) {
        burns.push(tv.playBurnAnimation());
        this._tiles[p.r][p.c] = null;
      }
    }
    await Promise.all(burns);

    // 2) collapse
    const drops: Promise<void>[] = [];
    for (let c = 0; c < this._config.columns; c++) {
      let write = this._config.rows - 1;
      for (let r = this._config.rows - 1; r >= 0; r--) {
        const tv = this._tiles[r][c];
        if (tv) {
          if (write !== r) {
            this._tiles[write][c] = tv;
            this._tiles[r][c] = null;
            const targetPos = this.getWorldPosition(write, c);
            drops.push(tv.playDropAnimation(targetPos));
            tv.gridR = write; tv.gridC = c;
          }
          write--;
        }
      }
    }
    await Promise.all(drops);

    // 3) refill from top (instantiate prefabs falling down)
    const refills: Promise<void>[] = [];
    for (let c = 0; c < this._config.columns; c++) {
      for (let r = this._config.rows - 1; r >= 0; r--) {
        if (!this._tiles[r][c]) {
          const node = cc.instantiate(this.tilePrefab);
          node.parent = this.gridParent;
          const startPos = this.getWorldPosition(-1, c);
          node.setPosition(startPos);
          const tv = node.getComponent(TileView) as ITileView;
          
          // Initialize the tile view with event bus
          if (this._eventBus) {
            tv.initialize(this._eventBus);
          }
          
          tv.gridR = r; tv.gridC = c;
          this._tiles[r][c] = tv;
          
          // Set tile data immediately with proper color
          tv.setData(newSnapshot[r][c]);
          
          const targetPos = this.getWorldPosition(r, c);
          refills.push(tv.playDropAnimation(targetPos, 0.05 * (this._config.rows - r)));
        }
      }
    }
    await Promise.all(refills);

    this._eventBus.publish(GameEvents.BOARD_ANIMATION_COMPLETED, {
      animationType: "refill"
    });
  }

  applySnapshot(snapshot: (ITile | null)[][]): void {
    for (let row = 0; row < this._config.rows; row++) {
      for (let column = 0; column < this._config.columns; column++) {
        const tileView = this._tiles[row][column];
        if (tileView) {
          tileView.setData(snapshot[row][column]);
        }
      }
    }
  }

  getTileViewAt(position: IPosition): ITileView | null {
    if (!this._isValidPosition(position)) return null;
    return this._tiles[position.row][position.column];
  }

  private _setupEventListeners(): void {
    if (this._eventBus) {
      this._eventBus.subscribe(GameEvents.TILE_CLICKED, this._onTileClicked.bind(this));
    }
  }

  private _removeEventListeners(): void {
    if (this._eventBus) {
      this._eventBus.unsubscribe(GameEvents.TILE_CLICKED, this._onTileClicked.bind(this));
    }
  }

  private _onTileClicked(event: any): void {
    this.node.emit("TileClicked", event.data);
  }

  private _clearGrid(): void {
    if (!this.gridParent) {
      console.error("GridParent is not assigned in BoardView!");
      return;
    }
    this.gridParent.removeAllChildren();
    this._tiles = Array.from({ length: this._config.rows }, () => 
      Array.from({ length: this._config.columns }, () => null)
    );
  }

  private _createTilesFromSnapshot(snapshot: (ITile | null)[][]): void {
    for (let row = 0; row < this._config.rows; row++) {
      for (let column = 0; column < this._config.columns; column++) {
        const position = { row, column };
        const tileView = this._createTileView(position);
        if (tileView) {
          tileView.setData(snapshot[row][column]);
          this._tiles[row][column] = tileView;
        } else {
          console.error(`Failed to create tile view at position ${row}, ${column}`);
          this._tiles[row][column] = null;
        }
      }
    }
  }

  private _createTileView(position: IPosition): ITileView | null {
    const node = cc.instantiate(this.tilePrefab);
    node.parent = this.gridParent;
    
    const tileView = node.getComponent(TileView) as ITileView;
    if (!tileView) {
      console.error("TileView component not found on tile prefab!");
      return null;
    }
    
    if (this._eventBus) {
      tileView.initialize(this._eventBus);
    }
    
    tileView.gridR = position.row;
    tileView.gridC = position.column;
    const worldPosition = this._getWorldPosition(position);
    node.setPosition(worldPosition);
    
    return tileView;
  }

  private _getWorldPosition(position: IPosition): cc.Vec2 {
    const x = position.column * this.cellSize;
    const y = -position.row * this.cellSize;
    return cc.v2(x, y);
  }

  private getWorldPosition(r: number, c: number): cc.Vec2 {
    const x = c * this.cellSize;
    const y = -r * this.cellSize;
    return cc.v2(x, y);
  }

  private _isValidPosition(position: IPosition): boolean {
    return position.row >= 0 && 
           position.row < this._config.rows && 
           position.column >= 0 && 
           position.column < this._config.columns;
  }

  private _getTileViewsAtPositions(positions: IPosition[]): ITileView[] {
    return positions
      .map(pos => this._tiles[pos.row][pos.column])
      .filter(tileView => tileView !== null) as ITileView[];
  }

  private _clearTilesAtPositions(positions: IPosition[]): void {
    for (const position of positions) {
      if (this._isValidPosition(position)) {
        this._tiles[position.row][position.column] = null;
      }
    }
  }

  private _calculateDropPositions(): { tileViews: ITileView[], targetPositions: IPosition[] } {
    const tileViews: ITileView[] = [];
    const targetPositions: IPosition[] = [];

    for (let column = 0; column < this._config.columns; column++) {
      let writeIndex = this._config.rows - 1;
      
      for (let row = this._config.rows - 1; row >= 0; row--) {
        const tileView = this._tiles[row][column];
        if (tileView) {
          if (writeIndex !== row) {
            this._tiles[writeIndex][column] = tileView;
            this._tiles[row][column] = null;
            tileView.gridR = writeIndex;
            tileView.gridC = column;
            
            tileViews.push(tileView);
            targetPositions.push({ row: writeIndex, column });
          }
          writeIndex--;
        }
      }
    }

    return { tileViews, targetPositions };
  }

  private _calculateRefillPositions(newSnapshot: (ITile | null)[][]): { 
    tileViews: ITileView[], 
    startPositions: IPosition[], 
    targetPositions: IPosition[] 
  } {
    const tileViews: ITileView[] = [];
    const startPositions: IPosition[] = [];
    const targetPositions: IPosition[] = [];

    for (let column = 0; column < this._config.columns; column++) {
      for (let row = this._config.rows - 1; row >= 0; row--) {
        if (!this._tiles[row][column] && newSnapshot[row][column]) {
          const tileView = this._createTileView({ row: -1, column });
          if (tileView) {
            tileView.setData(newSnapshot[row][column]);
            this._tiles[row][column] = tileView;
            
            tileViews.push(tileView);
            startPositions.push({ row: -1, column });
            targetPositions.push({ row, column });
          } else {
            console.error(`Failed to create tile view for refill at position ${row}, ${column}`);
          }
        }
      }
    }

    return { tileViews, startPositions, targetPositions };
  }

  // Legacy methods for backward compatibility
  initFromSnapshot(snapshot: (any | null)[][]): void {
    this.initializeFromSnapshot(snapshot as (ITile | null)[][]);
  }

  get rows(): number { return this._config?.rows || 8; }
  get cols(): number { return this._config?.columns || 8; }
}
