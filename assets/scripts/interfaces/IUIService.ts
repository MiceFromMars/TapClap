import { IGameState } from "./IGameState";

export interface IUIService {
  updateScore(score: number): void;
  updateMoves(movesLeft: number): void;
  updateGameState(state: IGameState): void;
  showGameOverMessage(message: string): void;
  hideGameOverMessage(): void;
}



