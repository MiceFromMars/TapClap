const { ccclass, property } = cc._decorator;
import { ITile } from "./interfaces/ITile";
import { IPosition } from "./interfaces/IPosition";
import { IBoardConfig } from "./interfaces/IGameConfig";
import { IAnimationConfig } from "./interfaces/IAnimationConfig";
import { ITileView } from "./interfaces/ITileView";
import { IEventBus } from "./interfaces/IEventBus";
import { GameEvents, IBoardAnimationEvent } from "./GameEvents";
import { IBoardView } from "./interfaces/IBoardView";
import { IAnimationController } from "./interfaces/IAnimationController";
import TileView from "./TileView";

export class DefaultAnimationController implements IAnimationController {
  constructor(
    private readonly _config: IAnimationConfig,
    private readonly _cellSize: number
  ) {}

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
      
      tileView.setVisualPosition(startWorldPos);
      
      const delay = targetPosition.row * this._config.refillDelay;
      return tileView.playDropAnimation(targetWorldPos, delay);
    });
    await Promise.all(animations);
  }

  private _getWorldPosition(position: IPosition): cc.Vec2 {
    const x = position.column * this._cellSize;
    const y = -position.row * this._cellSize;
    return cc.v2(x, y);
  }
}

@ccclass
export default class BoardView extends cc.Component implements IBoardView {
  @property(cc.Prefab) tilePrefab: cc.Prefab = null;
  @property(cc.Node) gridParent: cc.Node = null;

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
      refillDelay: this._config.refillDelay
    }, this._config.cellSize);
  }

  setConfig(config: IBoardConfig): void {
    this._config = config;
  }

  initializeFromSnapshot(snapshot: (ITile | null)[][]): void {
    this._clearGrid();
    this._createTilesFromSnapshot(snapshot);
  }

  async animateBurnAndCollapse(positions: IPosition[], newSnapshot: (ITile | null)[][]): Promise<void> {
    const tileViews = this._getTileViewsAtPositions(positions);
    await this._animationController.playBurnAnimation(tileViews);
    this._clearTilesAtPositions(positions);
    const { tileViews: dropTileViews, targetPositions } = this._calculateDropPositions();
    await this._animationController.playDropAnimation(dropTileViews, targetPositions);
    const { tileViews: refillTileViews, startPositions, targetPositions: refillTargetPositions } = this._calculateRefillPositions(newSnapshot);
    await this._animationController.playRefillAnimation(refillTileViews, startPositions, refillTargetPositions);
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
  }

  private _removeEventListeners(): void {
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
    const x = position.column * this._config.cellSize;
    const y = -position.row * this._config.cellSize;
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
          const tileView = this._createTileView({ row, column });
          if (tileView) {
            tileView.setData(newSnapshot[row][column]);
            this._tiles[row][column] = tileView;
            
            tileViews.push(tileView);
            startPositions.push({ row: -1 - (this._config.rows - 1 - row), column });
            targetPositions.push({ row, column });
          } else {
            console.error(`Failed to create tile view for refill at position ${row}, ${column}`);
          }
        }
      }
    }

    return { tileViews, startPositions, targetPositions };
  }

}
