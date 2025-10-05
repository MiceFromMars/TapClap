export interface IGameState {
  readonly score: number;
  readonly movesLeft: number;
  readonly isGameOver: boolean;
  readonly isWon: boolean;
}
