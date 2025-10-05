import { IGameState } from "./IGameState";
import { IGameConfig } from "./IGameConfig";
import { IPosition } from "./IPosition";
import { ITile } from "./ITile";

export interface IGameModel {
  getCurrentState(): IGameState;
  getBoardSnapshot(): (ITile | null)[][];
  processTileClick(position: IPosition): Promise<boolean>;
  processTileMatch(matchingGroup: IPosition[]): Promise<void>;
  restart(): void;
  isGameOver(): boolean;
  isWon(): boolean;
  hasValidMoves(): boolean;
  findMatchingGroup(position: IPosition): IPosition[];
}
