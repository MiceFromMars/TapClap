import { IPosition, IGameState } from "./types";

export class GameEvents {
  // Game State Events
  static readonly GAME_STARTED = "game:started";
  static readonly GAME_ENDED = "game:ended";
  static readonly GAME_WON = "game:won";
  static readonly GAME_LOST = "game:lost";
  static readonly GAME_RESTARTED = "game:restarted";

  // Board Events
  static readonly TILE_CLICKED = "board:tile_clicked";
  static readonly TILES_MATCHED = "board:tiles_matched";
  static readonly BOARD_UPDATED = "board:updated";
  static readonly BOARD_ANIMATION_STARTED = "board:animation_started";
  static readonly BOARD_ANIMATION_COMPLETED = "board:animation_completed";

  // UI Events
  static readonly SCORE_UPDATED = "ui:score_updated";
  static readonly MOVES_UPDATED = "ui:moves_updated";
  static readonly UI_UPDATED = "ui:updated";

  // Input Events
  static readonly INPUT_LOCKED = "input:locked";
  static readonly INPUT_UNLOCKED = "input:unlocked";
}

export interface ITileClickedEvent {
  position: IPosition;
}

export interface ITilesMatchedEvent {
  positions: IPosition[];
  score: number;
}

export interface IGameStateChangedEvent {
  state: IGameState;
}

export interface IBoardAnimationEvent {
  animationType: "burn" | "drop" | "refill";
  positions?: IPosition[];
}

