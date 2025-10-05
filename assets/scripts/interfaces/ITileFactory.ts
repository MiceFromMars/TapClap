import { ITile } from "./ITile";
import { IBoardConfig } from "./IGameConfig";

export interface ITileFactory {
  next(): ITile;
  createTile(): ITile;
  createTiles(count: number): ITile[];
}

export interface ITileGenerator {
  generateColorIndex(): number;
}

