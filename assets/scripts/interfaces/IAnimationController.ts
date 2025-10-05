import { ITileView } from "./ITileView";
import { IPosition } from "./IPosition";

export interface IAnimationController {
  playBurnAnimation(tileViews: ITileView[]): Promise<void>;
  playDropAnimation(tileViews: ITileView[], targetPositions: IPosition[]): Promise<void>;
  playRefillAnimation(tileViews: ITileView[], startPositions: IPosition[], targetPositions: IPosition[]): Promise<void>;
}



