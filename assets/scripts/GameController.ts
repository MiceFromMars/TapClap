const { ccclass, property } = cc._decorator;
import { IGameConfig, IBoardConfig, IScoringConfig, IUIConfig } from "./interfaces/IGameConfig";
import { IPosition } from "./interfaces/IPosition";
import { IEventBus } from "./interfaces/IEventBus";
import { gameEventBus } from "./EventBus";
import { initializeInputManager, getInputManager } from "./InputLock";
import { IBoardView } from "./interfaces/IBoardView";
import { IGameBoard } from "./interfaces/IGameBoard";
import { GameBoard } from "./GameBoard";
import { IGameModel } from "./interfaces/IGameModel";
import { GameModel } from "./GameModel";
import { IBoardPresenter } from "./interfaces/IBoardPresenter";
import { BoardPresenter } from "./BoardPresenter";
import { IUIService } from "./interfaces/IUIService";
import { UIService } from "./UIService";
import { TileFactoryFactory } from "./TileFactory";
import { ScoringStrategyFactory } from "./ScoringStrategy";
import { GameEvents } from "./GameEvents";

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
  @property(cc.Float) cellSize: number = 72;
  @property(cc.Float) animationDuration: number = 0.3;
  @property(cc.Float) refillDelay: number = 0.05;

  private _eventBus: IEventBus;
  private _gameConfig: IGameConfig;
  private _board: IGameBoard;
  private _gameModel: IGameModel;
  private _boardPresenter: IBoardPresenter;
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
    this._eventBus = gameEventBus;
    initializeInputManager(this._eventBus);
    this._gameConfig = this._createGameConfig();
    this._board = this._createGameBoard();
    this._gameModel = this._createGameModel();
    this._boardPresenter = this._createBoardPresenter();
    this._uiService = this._createUIService();
    this._initializeBoardView();
  }

  private _createGameConfig(): IGameConfig {
    const boardConfig: IBoardConfig = {
      rows: this.rows,
      columns: this.cols,
      cellSize: this.cellSize,
      colorCount: this.colorCount
    };

    const scoringConfig: IScoringConfig = {
      baseScore: 10,
      multiplier: 2,
      targetScore: this.targetScore
    };

    const uiConfig: IUIConfig = {
      moves: this.moves,
      animationDuration: this.animationDuration
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

  private _createGameModel(): IGameModel {
    const scoringStrategy = ScoringStrategyFactory.createDefault(this._gameConfig.scoring);
    return new GameModel(this._board, scoringStrategy, this._eventBus, this._gameConfig);
  }

  private _createBoardPresenter(): IBoardPresenter {
    return new BoardPresenter();
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
      this._boardPresenter.initialize(this.boardView, this._board, this._eventBus, this._gameConfig.board, this._gameModel);
    }
  }

  private _setupEventListeners(): void {
    this._eventBus.subscribe(GameEvents.BOARD_ANIMATION_STARTED, this._onAnimationStarted.bind(this));
    this._eventBus.subscribe(GameEvents.BOARD_ANIMATION_COMPLETED, this._onAnimationCompleted.bind(this));
  }

  private _cleanupEventListeners(): void {
    this._eventBus.unsubscribe(GameEvents.BOARD_ANIMATION_STARTED, this._onAnimationStarted.bind(this));
    this._eventBus.unsubscribe(GameEvents.BOARD_ANIMATION_COMPLETED, this._onAnimationCompleted.bind(this));
  }

  private _startGame(): void {
    this._board.initialize();
    
    if (this.boardView) {
      this.boardView.initializeFromSnapshot(this._gameModel.getBoardSnapshot());
    } else {
      console.error("BoardView is not assigned!");
    }
    
    this._eventBus.publish(GameEvents.GAME_STARTED, {});
  }


  private _onAnimationStarted(): void {
    getInputManager().lock();
  }

  private _onAnimationCompleted(): void {
    getInputManager().unlock();
  }

  public onRestartButton(): void {
    this._gameModel.restart();
    if (this.boardView) {
      this.boardView.initializeFromSnapshot(this._gameModel.getBoardSnapshot());
    }
  }

}
