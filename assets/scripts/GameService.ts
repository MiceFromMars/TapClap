import { IGameState, IGameConfig, IPosition, ITile } from "./types";
import { IGameBoard } from "./interfaces/IGameBoard";
import { IScoringStrategy } from "./interfaces/IScoringStrategy";
import { IEventBus } from "./interfaces/IEventBus";
import { GameEvents, ITilesMatchedEvent, IGameStateChangedEvent } from "./GameEvents";
import { IGameService } from "./interfaces/IGameService";

export class GameService implements IGameService {
  private _score = 0;
  private _movesLeft = 0;
  private _isGameOver = false;
  private _isWon = false;

  constructor(
    private readonly _board: IGameBoard,
    private readonly _scoringStrategy: IScoringStrategy,
    private readonly _eventBus: IEventBus,
    private readonly _config: IGameConfig
  ) {
    this._movesLeft = this._config.ui.moves;
    this._setupEventListeners();
  }

  getCurrentState(): IGameState {
    return {
      score: this._score,
      movesLeft: this._movesLeft,
      isGameOver: this._isGameOver,
      isWon: this._isWon
    };
  }

  async processTileClick(position: IPosition): Promise<boolean> {
    if (this._isGameOver || this._movesLeft <= 0) {
      return false;
    }

    const matchingGroup = this._board.findMatchingGroup(position);
    if (matchingGroup.length < 2) {
      return false;
    }

    // Calculate score
    const score = this._scoringStrategy.getTotalScore(matchingGroup.length);
    this._score += score;
    this._movesLeft--;

    // Remove tiles from board
    this._board.removeTiles(matchingGroup);

    // Publish events
    this._eventBus.publish(GameEvents.TILES_MATCHED, {
      positions: matchingGroup,
      score
    } as ITilesMatchedEvent);

    this._updateGameState();

    return true;
  }

  restart(): void {
    this._score = 0;
    this._movesLeft = this._config.ui.moves;
    this._isGameOver = false;
    this._isWon = false;
    this._board.initialize();
    this._eventBus.publish(GameEvents.GAME_RESTARTED, {});
  }

  isGameOver(): boolean {
    return this._isGameOver;
  }

  isWon(): boolean {
    return this._isWon;
  }

  private _setupEventListeners(): void {
    this._eventBus.subscribe(GameEvents.BOARD_UPDATED, this._onBoardUpdated.bind(this));
  }

  private _onBoardUpdated(): void {
    this._checkGameConditions();
  }

  private _checkGameConditions(): void {
    if (this._score >= this._config.scoring.targetScore) {
      this._isWon = true;
      this._isGameOver = true;
      this._eventBus.publish(GameEvents.GAME_WON, {});
    } else if (this._movesLeft <= 0 || !this._board.hasValidMoves()) {
      this._isGameOver = true;
      this._eventBus.publish(GameEvents.GAME_LOST, {});
    }
  }

  private _updateGameState(): void {
    this._eventBus.publish(GameEvents.SCORE_UPDATED, { score: this._score });
    this._eventBus.publish(GameEvents.MOVES_UPDATED, { movesLeft: this._movesLeft });
    
    const state = this.getCurrentState();
    this._eventBus.publish(GameEvents.UI_UPDATED, { state } as IGameStateChangedEvent);
  }
}
