import { ITile } from "./ITile";
import { IPosition } from "./IPosition";
import { IBoardConfig } from "./IGameConfig";
import { ITileView } from "./ITileView";
import { IEventBus } from "./IEventBus";

export interface IBoardView {
  initialize(eventBus: IEventBus, config: IBoardConfig): void;
  initializeFromSnapshot(snapshot: (ITile | null)[][]): void;
  animateBurnAndCollapse(positions: IPosition[], newSnapshot: (ITile | null)[][]): Promise<void>;
  applySnapshot(snapshot: (ITile | null)[][]): void;
  getTileViewAt(position: IPosition): ITileView | null;
  setConfig(config: IBoardConfig): void;
}



