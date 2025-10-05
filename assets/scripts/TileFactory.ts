import { ITile } from "./interfaces/ITile";
import { IBoardConfig } from "./interfaces/IGameConfig";
import { ITileFactory, ITileGenerator } from "./interfaces/ITileFactory";

export class RandomTileGenerator implements ITileGenerator {
  constructor(private readonly _colorCount: number) {
    if (_colorCount <= 0) {
      throw new Error("Color count must be greater than 0");
    }
  }

  generateColorIndex(): number {
    return Math.floor(Math.random() * this._colorCount);
  }
}

export class TileFactory implements ITileFactory {
  private _nextId = 1;

  constructor(
    private readonly _generator: ITileGenerator,
    private readonly _config: IBoardConfig
  ) {}

  next(): ITile {
    const colorIndex = this._generator.generateColorIndex();
    return {
      id: this._nextId++,
      colorIndex
    };
  }

  createTile(): ITile {
    return this.next();
  }

  createTiles(count: number): ITile[] {
    if (count <= 0) {
      throw new Error("Count must be greater than 0");
    }

    const tiles: ITile[] = [];
    for (let i = 0; i < count; i++) {
      tiles.push(this.next());
    }
    return tiles;
  }
}

// Factory for creating tile factories
export class TileFactoryFactory {
  static createRandomFactory(config: IBoardConfig): ITileFactory {
    const generator = new RandomTileGenerator(config.colorCount);
    return new TileFactory(generator, config);
  }
}