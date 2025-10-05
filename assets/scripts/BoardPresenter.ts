import { IBoardPresenter } from "./interfaces/IBoardPresenter";
import { IBoardView } from "./interfaces/IBoardView";
import { IGameBoard } from "./interfaces/IGameBoard";
import { IEventBus } from "./interfaces/IEventBus";
import { IBoardConfig } from "./interfaces/IGameConfig";
import { IPosition } from "./interfaces/IPosition";
import { ITile } from "./interfaces/ITile";
import { IGameModel } from "./interfaces/IGameModel";
import { GameEvents } from "./GameEvents";

export class BoardPresenter implements IBoardPresenter {
  private _view: IBoardView;
  private _board: IGameBoard;
  private _gameModel: IGameModel;
  private _eventBus: IEventBus;
  private _config: IBoardConfig;
  private _isAnimating: boolean = false;

  initialize(view: IBoardView, board: IGameBoard, eventBus: IEventBus, config: IBoardConfig, gameModel: IGameModel): void {
    this._view = view;
    this._board = board;
    this._gameModel = gameModel;
    this._eventBus = eventBus;
    this._config = config;
    
    this._setupEventListeners();
    this._initializeView();
  }

  async onTileClicked(position: IPosition): Promise<void> {
    if (this._isAnimating) return;

    const matchingGroup = this._board.findMatchingGroup(position);
    if (matchingGroup.length < 2) return;

    const canMakeMove = !this._gameModel.isGameOver() && this._gameModel.getCurrentState().movesLeft > 0;
    if (!canMakeMove) return;

    this._isAnimating = true;
    this._eventBus.publish(GameEvents.BOARD_ANIMATION_STARTED, {
      animationType: "burn",
      positions: matchingGroup
    });

    try {
      await this._gameModel.processTileMatch(matchingGroup);
      const newSnapshot = this._board.getSnapshot();
      await this._view.animateBurnAndCollapse(matchingGroup, newSnapshot);
      this._eventBus.publish(GameEvents.BOARD_ANIMATION_COMPLETED, {
        animationType: "refill"
      });
    } finally {
      this._isAnimating = false;
    }
  }

  async onBoardUpdated(newSnapshot: (ITile | null)[][]): Promise<void> {
    if (this._isAnimating) return;
    
    this._view.applySnapshot(newSnapshot);
  }

  async onTilesMatched(positions: IPosition[]): Promise<void> {
  }

  destroy(): void {
    this._removeEventListeners();
  }

  private _setupEventListeners(): void {
    this._eventBus.subscribe(GameEvents.TILE_CLICKED, this._onTileClicked.bind(this));
    this._eventBus.subscribe(GameEvents.BOARD_UPDATED, this._onBoardUpdated.bind(this));
    this._eventBus.subscribe(GameEvents.TILES_MATCHED, this._onTilesMatched.bind(this));
  }

  private _removeEventListeners(): void {
    this._eventBus.unsubscribe(GameEvents.TILE_CLICKED, this._onTileClicked.bind(this));
    this._eventBus.unsubscribe(GameEvents.BOARD_UPDATED, this._onBoardUpdated.bind(this));
    this._eventBus.unsubscribe(GameEvents.TILES_MATCHED, this._onTilesMatched.bind(this));
  }

  private _initializeView(): void {
    this._view.setConfig(this._config);
    this._view.initializeFromSnapshot(this._board.getSnapshot());
  }

  private async _onTileClicked(event: any): Promise<void> {
    const position = event.data.position;
    await this.onTileClicked(position);
  }

  private async _onBoardUpdated(event: any): Promise<void> {
    const newSnapshot = this._board.getSnapshot();
    await this.onBoardUpdated(newSnapshot);
  }

  private async _onTilesMatched(event: any): Promise<void> {
    const positions = event.data.positions;
    await this.onTilesMatched(positions);
  }
}
