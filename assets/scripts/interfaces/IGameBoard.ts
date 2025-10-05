import { ITile } from "./ITile";
import { IPosition } from "./IPosition";

export interface IGameBoard {
  getRows(): number;
  getColumns(): number;
  getTileAt(position: IPosition): ITile | null;
  findMatchingGroup(startPosition: IPosition): IPosition[];
  removeTiles(positions: IPosition[]): void;
  hasValidMoves(): boolean;
  getSnapshot(): (ITile | null)[][];
  initialize(): void;
}



