import { ITile } from "./interfaces/ITile";
import { IPosition, Pos } from "./interfaces/IPosition";
import { IBoardConfig } from "./interfaces/IGameConfig";
import { ITileFactory } from "./interfaces/ITileFactory";
import { IEventBus } from "./interfaces/IEventBus";
import { GameEvents, ITilesMatchedEvent } from "./GameEvents";
import { IGameBoard } from "./interfaces/IGameBoard";


export class GameBoard implements IGameBoard {
  private grid: (ITile | null)[][];

  constructor(
    private readonly _config: IBoardConfig,
    private readonly _tileFactory: ITileFactory,
    private readonly _eventBus: IEventBus
  ) {
    this.grid = Array.from({ length: _config.rows }, () => 
      Array.from({ length: _config.columns }, () => null)
    );
    this.fillAll();
  }

  getRows(): number {
    return this._config.rows;
  }

  getColumns(): number {
    return this._config.columns;
  }

  getTileAt(position: IPosition): ITile | null {
    if (!this._isValidPosition(position)) return null;
    return this.grid[position.row][position.column];
  }

  tileAt(p: Pos): ITile | null { 
    return this.grid[p.r][p.c]; 
  }

  findGroup(start: Pos): Pos[] {
    const startTile = this.tileAt(start); 
    if (!startTile) return [];
    const color = startTile.colorIndex;
    const visited = new Set<string>();
    const stack: Pos[] = [start];
    const result: Pos[] = [];
    const key = (p: Pos) => `${p.r},${p.c}`;

    while (stack.length) {
      const p = stack.pop()!;
      if (visited.has(key(p))) continue;
      visited.add(key(p));
      const t = this.tileAt(p);
      if (!t || t.colorIndex !== color) continue;
      result.push(p);
      const nbs = [{ r: p.r-1, c: p.c }, { r: p.r+1, c: p.c }, { r: p.r, c: p.c-1 }, { r: p.r, c: p.c+1 }];
      for (const n of nbs) {
        if (n.r < 0 || n.r >= this._config.rows || n.c < 0 || n.c >= this._config.columns) continue;
        if (!visited.has(key(n))) stack.push(n);
      }
    }
    return result;
  }

  findMatchingGroup(startPosition: IPosition): IPosition[] {
    const pos: Pos = { r: startPosition.row, c: startPosition.column };
    const result = this.findGroup(pos);
    return result.map(p => ({ row: p.r, column: p.c }));
  }

  removeTiles(positions: IPosition[]): void {
    if (positions.length === 0) return;

    for (const position of positions) {
      if (this._isValidPosition(position)) {
        this.grid[position.row][position.column] = null;
      }
    }

    this.applyGravity();
    this.refillTop();

    this._eventBus.publish(GameEvents.BOARD_UPDATED, {
      removedPositions: positions
    });
  }


  hasValidMoves(): boolean {
    const seen = new Set<string>();
    const key = (p: Pos) => `${p.r},${p.c}`;
    for (let r = 0; r < this._config.rows; r++) for (let c = 0; c < this._config.columns; c++) {
      const p = { r, c };
      if (seen.has(key(p))) continue;
      const t = this.tileAt(p); if (!t) continue;
      const group = this.findGroup(p);
      for (const g of group) seen.add(key(g));
      if (group.length >= 2) return true;
    }
    return false;
  }


  getSnapshot(): (ITile | null)[][] {
    return this.grid.map(row => 
      row.map(cell => cell ? { ...cell } : null)
    );
  }


  initialize(): void {
    this.fillAll();
  }

  private fillAll() {
    for (let r = 0; r < this._config.rows; r++)
      for (let c = 0; c < this._config.columns; c++)
        this.grid[r][c] = this._tileFactory.next();
  }

  private _isValidPosition(position: IPosition): boolean {
    return position.row >= 0 && 
           position.row < this._config.rows && 
           position.column >= 0 && 
           position.column < this._config.columns;
  }

  private applyGravity() {
    for (let c = 0; c < this._config.columns; c++) {
      let write = this._config.rows - 1;
      for (let r = this._config.rows - 1; r >= 0; r--) {
        if (this.grid[r][c]) {
          if (write !== r) { this.grid[write][c] = this.grid[r][c]; this.grid[r][c] = null; }
          write--;
        }
      }
    }
  }

  private refillTop() {
    for (let c = 0; c < this._config.columns; c++)
      for (let r = 0; r < this._config.rows; r++)
        if (!this.grid[r][c]) this.grid[r][c] = this._tileFactory.next();
  }
}