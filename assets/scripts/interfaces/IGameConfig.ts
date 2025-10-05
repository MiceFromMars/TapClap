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
