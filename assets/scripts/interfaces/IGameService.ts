import { IGameState } from "./IGameState";
import { IPosition } from "./IPosition";

export interface IGameService {
  getCurrentState(): IGameState;
  processTileClick(position: IPosition): Promise<boolean>;
  restart(): void;
  isGameOver(): boolean;
  isWon(): boolean;
}

