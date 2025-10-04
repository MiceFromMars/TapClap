import { IGameState, IPosition } from "../types";

export interface IGameService {
  getCurrentState(): IGameState;
  processTileClick(position: IPosition): Promise<boolean>;
  restart(): void;
  isGameOver(): boolean;
  isWon(): boolean;
}

