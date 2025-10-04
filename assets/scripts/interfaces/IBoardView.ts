import { ITile, IPosition, IBoardConfig } from "../types";
import { ITileView } from "./ITileView";

export interface IBoardView {
  initializeFromSnapshot(snapshot: (ITile | null)[][]): void;
  animateBurnAndCollapse(positions: IPosition[], newSnapshot: (ITile | null)[][]): Promise<void>;
  applySnapshot(snapshot: (ITile | null)[][]): void;
  getTileViewAt(position: IPosition): ITileView | null;
  setConfig(config: IBoardConfig): void;
}

