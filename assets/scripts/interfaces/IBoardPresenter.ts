import { ITile } from "./ITile";
import { IPosition } from "./IPosition";
import { IBoardConfig } from "./IGameConfig";
import { IBoardView } from "./IBoardView";
import { IGameBoard } from "./IGameBoard";
import { IEventBus } from "./IEventBus";
import { IGameModel } from "./IGameModel";

export interface IBoardPresenter {
  initialize(view: IBoardView, board: IGameBoard, eventBus: IEventBus, config: IBoardConfig, gameModel: IGameModel): void;
  onTileClicked(position: IPosition): Promise<void>;
  onBoardUpdated(newSnapshot: (ITile | null)[][]): Promise<void>;
  onTilesMatched(positions: IPosition[]): Promise<void>;
  destroy(): void;
}
