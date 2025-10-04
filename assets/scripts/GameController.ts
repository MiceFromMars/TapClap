const { ccclass, property } = cc._decorator;
import { IGameConfig, IBoardConfig, IScoringConfig, IUIConfig, IPosition } from "./types";
import { IEventBus } from "./interfaces/IEventBus";
import { gameEventBus } from "./EventBus";
import { initializeInputManager, getInputManager } from "./InputLock";
import { IBoardView } from "./interfaces/IBoardView";
import { IGameBoard } from "./interfaces/IGameBoard";
import { GameBoard } from "./GameBoard";
import { IGameService } from "./interfaces/IGameService";
import { GameService } from "./GameService";
import { IUIService } from "./interfaces/IUIService";
import { UIService } from "./UIService";
import { TileFactoryFactory } from "./TileFactory";
import { ScoringStrategyFactory } from "./ScoringStrategy";
import { GameEvents, ITileClickedEvent } from "./GameEvents";

@ccclass
export default class GameController extends cc.Component {
  @property(cc.Component) boardView: IBoardView = null;
  @property(cc.Label) scoreLabel: cc.Label = null;
  @property(cc.Label) movesLabel: cc.Label = null;
  @property(cc.Node) popup: cc.Node = null;
  @property(cc.Label) popupMessage: cc.Label = null;

  @property(cc.Integer) rows: number = 8;
  @property(cc.Integer) cols: number = 8;
  @property(cc.Integer) moves: number = 20;
  @property(cc.Integer) targetScore: number = 500;
  @property(cc.Integer) colorCount: number = 5;

  private _eventBus: IEventBus;
  private _gameConfig: IGameConfig;
  private _board: IGameBoard;
  private _gameService: IGameService;
  private _uiService: IUIService;

  onLoad() {
    this._initializeServices();
    this._setupEventListeners();
    this._startGame();
  }

  onDestroy() {
    this._cleanupEventListeners();
  }

  private _initializeServices(): void {
    // Initialize event bus
    this._eventBus = gameEventBus;

    // Initialize input manager
    initializeInputManager(this._eventBus);

    // Create game configuration
    this._gameConfig = this._createGameConfig();

    // Initialize board
    this._board = this._createGameBoard();

    // Initialize game service
    this._gameService = this._createGameService();

    // Initialize UI service
    this._uiService = this._createUIService();

    // Initialize board view
    this._initializeBoardView();
  }

  private _createGameConfig(): IGameConfig {
    const boardConfig: IBoardConfig = {
      rows: this.rows,
      columns: this.cols,
      cellSize: 72,
      colorCount: this.colorCount
    };

    const scoringConfig: IScoringConfig = {
      baseScore: 10,
      multiplier: 2,
      targetScore: this.targetScore
    };

    const uiConfig: IUIConfig = {
      moves: this.moves,
      animationDuration: 0.3
    };

    return {
      board: boardConfig,
      scoring: scoringConfig,
      ui: uiConfig
    };
  }

  private _createGameBoard(): IGameBoard {
    const tileFactory = TileFactoryFactory.createRandomFactory(this._gameConfig.board);
    return new GameBoard(this._gameConfig.board, tileFactory, this._eventBus);
  }

  private _createGameService(): IGameService {
    const scoringStrategy = ScoringStrategyFactory.createDefault(this._gameConfig.scoring);
    return new GameService(this._board, scoringStrategy, this._eventBus, this._gameConfig);
  }

  private _createUIService(): IUIService {
    return new UIService(
      this._eventBus,
      this.scoreLabel,
      this.movesLabel,
      this.popup,
      this.popupMessage
    );
  }

  private _initializeBoardView(): void {
    if (this.boardView) {
      (this.boardView as any).initialize(this._eventBus, this._gameConfig.board);
    }
  }

  private _setupEventListeners(): void {
    this._eventBus.subscribe(GameEvents.TILE_CLICKED, this._onTileClicked.bind(this));
    this._eventBus.subscribe(GameEvents.BOARD_ANIMATION_STARTED, this._onAnimationStarted.bind(this));
    this._eventBus.subscribe(GameEvents.BOARD_ANIMATION_COMPLETED, this._onAnimationCompleted.bind(this));
  }

  private _cleanupEventListeners(): void {
    this._eventBus.unsubscribe(GameEvents.TILE_CLICKED, this._onTileClicked.bind(this));
    this._eventBus.unsubscribe(GameEvents.BOARD_ANIMATION_STARTED, this._onAnimationStarted.bind(this));
    this._eventBus.unsubscribe(GameEvents.BOARD_ANIMATION_COMPLETED, this._onAnimationCompleted.bind(this));
  }

  private _startGame(): void {
    this._board.initialize();
    
    if (this.boardView) {
      this.boardView.initializeFromSnapshot(this._board.getSnapshot());
    } else {
      console.error("BoardView is not assigned!");
    }
    
    this._eventBus.publish(GameEvents.GAME_STARTED, {});
  }

  private async _onTileClicked(event: any): Promise<void> {
    const inputManager = getInputManager();
    if (inputManager.isLocked()) return;

    inputManager.lock();

    try {
      const tileClickedEvent = event.data as ITileClickedEvent;
      
      // Get matching group BEFORE processing the click
      const matchingGroup = this._board.findMatchingGroup(tileClickedEvent.position);
      
      const success = await this._gameService.processTileClick(tileClickedEvent.position);
      
      if (success && this.boardView) {
        await this.boardView.animateBurnAndCollapse(matchingGroup, this._board.getSnapshot());
      }
    } finally {
      inputManager.unlock();
    }
  }

  private _onAnimationStarted(): void {
    getInputManager().lock();
  }

  private _onAnimationCompleted(): void {
    getInputManager().unlock();
  }

  public onRestartButton(): void {
    this._gameService.restart();
    if (this.boardView) {
      this.boardView.initializeFromSnapshot(this._board.getSnapshot());
    }
  }

}
