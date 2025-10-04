import { ITile, IBoardConfig } from "../types";

export interface ITileFactory {
  next(): ITile;
  createTile(): ITile;
  createTiles(count: number): ITile[];
}

export interface ITileGenerator {
  generateColorIndex(): number;
}

