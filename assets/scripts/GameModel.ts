import { IGameModel } from "./interfaces/IGameModel";
import { IGameState } from "./interfaces/IGameState";
import { IGameConfig } from "./interfaces/IGameConfig";
import { IPosition } from "./interfaces/IPosition";
import { ITile } from "./interfaces/ITile";
import { IGameBoard } from "./interfaces/IGameBoard";
import { IScoringStrategy } from "./interfaces/IScoringStrategy";
import { IEventBus } from "./interfaces/IEventBus";
import { GameEvents, ITilesMatchedEvent } from "./GameEvents";

export class GameModel implements IGameModel {
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

  onDestroy(): void {
    this._cleanupEventListeners();
  }

  getCurrentState(): IGameState {
    return {
      score: this._score,
      movesLeft: this._movesLeft,
      isGameOver: this._isGameOver,
      isWon: this._isWon
    };
  }

  getBoardSnapshot(): (ITile | null)[][] {
    return this._board.getSnapshot();
  }

  async processTileClick(position: IPosition): Promise<boolean> {
    if (this._isGameOver || this._movesLeft <= 0) {
      return false;
    }

    const matchingGroup = this._board.findMatchingGroup(position);
    if (matchingGroup.length < 2) {
      return false;
    }

    const score = this._scoringStrategy.getTotalScore(matchingGroup.length);
    this._score += score;
    this._movesLeft--;
    this._eventBus.publish(GameEvents.TILES_MATCHED, {
      positions: matchingGroup,
      score
    } as ITilesMatchedEvent);

    this._updateGameState();
    this._checkGameConditions();

    return true;
  }

  async processTileMatch(matchingGroup: IPosition[]): Promise<void> {
    if (this._isGameOver || this._movesLeft <= 0) {
      return;
    }

    const score = this._scoringStrategy.getTotalScore(matchingGroup.length);
    this._score += score;
    this._movesLeft--;

    this._board.removeTiles(matchingGroup);
    this._eventBus.publish(GameEvents.TILES_MATCHED, {
      positions: matchingGroup,
      score
    } as ITilesMatchedEvent);

    this._updateGameState();
    this._checkGameConditions();
  }

  restart(): void {
    this._score = 0;
    this._movesLeft = this._config.ui.moves;
    this._isGameOver = false;
    this._isWon = false;
    this._board.initialize();
    this._eventBus.publish(GameEvents.GAME_RESTARTED, {});
    this._updateGameState();
  }

  isGameOver(): boolean {
    return this._isGameOver;
  }

  isWon(): boolean {
    return this._isWon;
  }

  hasValidMoves(): boolean {
    return this._board.hasValidMoves();
  }

  findMatchingGroup(position: IPosition): IPosition[] {
    return this._board.findMatchingGroup(position);
  }

  private _setupEventListeners(): void {
    this._eventBus.subscribe(GameEvents.BOARD_UPDATED, this._onBoardUpdated.bind(this));
    this._eventBus.subscribe(GameEvents.GAME_STARTED, this._updateGameState.bind(this));
  }

  private _cleanupEventListeners(): void {
    this._eventBus.unsubscribe(GameEvents.BOARD_UPDATED, this._onBoardUpdated.bind(this));
    this._eventBus.unsubscribe(GameEvents.GAME_STARTED, this._updateGameState.bind(this));
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
    this._eventBus.publish(GameEvents.UI_UPDATED, { state });
  }
}
