import { ITile } from "./ITile";
import { IPosition } from "./IPosition";
import { IEventBus } from "./IEventBus";

export interface ITileView {
  initialize(eventBus: IEventBus): void;
  setData(tile: ITile | null): void;
  playBurnAnimation(): Promise<void>;
  playDropAnimation(targetPosition: cc.Vec2, delay?: number): Promise<void>;
  getPosition(): IPosition;
  setPosition(position: IPosition): void;
  setVisualPosition(position: cc.Vec2): void;
  isActive(): boolean;
  setActive(active: boolean): void;
  gridR: number;
  gridC: number;
}

