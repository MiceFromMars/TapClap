export interface ITile {
  readonly id: number;
  readonly colorIndex: number;
}

export interface IPosition {
  readonly row: number;
  readonly column: number;
}

export interface IGameConfig {
  readonly board: IBoardConfig;
  readonly scoring: IScoringConfig;
  readonly ui: IUIConfig;
}

export interface IBoardConfig {
  readonly rows: number;
  readonly columns: number;
  readonly cellSize: number;
  readonly colorCount: number;
}

export interface IScoringConfig {
  readonly baseScore: number;
  readonly multiplier: number;
  readonly targetScore: number;
}

export interface IUIConfig {
  readonly moves: number;
  readonly animationDuration: number;
}

export interface IGameState {
  readonly score: number;
  readonly movesLeft: number;
  readonly isGameOver: boolean;
  readonly isWon: boolean;
}

export interface IGameEvent {
  readonly type: string;
  readonly data: any;
  readonly timestamp: number;
}

export interface IAnimationConfig {
  readonly burnDuration: number;
  readonly dropDuration: number;
  readonly refillDelay: number;
}

// Legacy types for backward compatibility
export type Tile = ITile;

export interface Pos {
  readonly r: number;
  readonly c: number;
}