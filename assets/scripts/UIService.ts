import { IGameState } from "./interfaces/IGameState";
import { IEventBus } from "./interfaces/IEventBus";
import { GameEvents, IGameStateChangedEvent } from "./GameEvents";
import { IUIService } from "./interfaces/IUIService";

export class UIService implements IUIService {
  constructor(
    private readonly _eventBus: IEventBus,
    private readonly _scoreLabel: cc.Label,
    private readonly _movesLabel: cc.Label,
    private readonly _popup: cc.Node,
    private readonly _popupMessage: cc.Label
  ) {
    this._setupEventListeners();
  }

  updateScore(score: number): void {
    if (this._scoreLabel) {
      this._scoreLabel.string = `${score} ИЗ 500`;
    }
  }

  updateMoves(movesLeft: number): void {
    if (this._movesLabel) {
      this._movesLabel.string = `${movesLeft}`;
    }
  }

  updateGameState(state: IGameState): void {
    this.updateScore(state.score);
    this.updateMoves(state.movesLeft);
  }

  showGameOverMessage(message: string): void {
    if (this._popup) {
      this._popup.active = true;
      if (this._popupMessage) {
        this._popupMessage.string = message;
      }
    }
  }

  hideGameOverMessage(): void {
    if (this._popup) {
      this._popup.active = false;
    }
  }

  private _setupEventListeners(): void {
    this._eventBus.subscribe(GameEvents.SCORE_UPDATED, (event) => {
      this.updateScore(event.data.score);
    });

    this._eventBus.subscribe(GameEvents.MOVES_UPDATED, (event) => {
      this.updateMoves(event.data.movesLeft);
    });

    this._eventBus.subscribe(GameEvents.UI_UPDATED, (event) => {
      this.updateGameState(event.data.state);
    });

    this._eventBus.subscribe(GameEvents.GAME_WON, () => {
      this.showGameOverMessage("ПОБЕДА!");
    });

    this._eventBus.subscribe(GameEvents.GAME_LOST, () => {
      this.showGameOverMessage("ПРОИГРЫШ");
    });

    this._eventBus.subscribe(GameEvents.GAME_RESTARTED, () => {
      this.hideGameOverMessage();
    });
  }
}
