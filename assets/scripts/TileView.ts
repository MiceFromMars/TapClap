const { ccclass, property } = cc._decorator;
import { ITile, IPosition, IAnimationConfig } from "./types";
import { GameEvents, ITileClickedEvent } from "./GameEvents";
import { IEventBus } from "./interfaces/IEventBus";
import { ITileView } from "./interfaces/ITileView";

@ccclass
export default class TileView extends cc.Component implements ITileView {
  @property(cc.Sprite) sprite: cc.Sprite = null;
  @property(cc.Label) label: cc.Label = null;
  @property([cc.SpriteFrame]) tileSprites: cc.SpriteFrame[] = [];
  @property(cc.Float) burnDuration: number = 0.18;
  @property(cc.Float) dropDuration: number = 0.28;

  public gridR = 0;
  public gridC = 0;
  private _tileData: ITile | null = null;
  private _eventBus: IEventBus;

  onLoad() {
    this.node.on(cc.Node.EventType.TOUCH_END, this._onTileClicked, this);
  }

  onDestroy() {
    this.node.off(cc.Node.EventType.TOUCH_END, this._onTileClicked, this);
  }

  initialize(eventBus: IEventBus): void {
    this._eventBus = eventBus;
  }

  private _onTileClicked(): void {
    if (!this._eventBus) return;
    
    const event: ITileClickedEvent = {
      position: this.getPosition()
    };
    
    this._eventBus.publish(GameEvents.TILE_CLICKED, event);
  }

  setData(tile: ITile | null): void {
    this._tileData = tile;
    
    if (!tile) {
      this.setActive(false);
      return;
    }

    this.setActive(true);
    this._updateVisuals(tile);
  }

  private _updateVisuals(tile: ITile): void {
    if (this.tileSprites && this.tileSprites[tile.colorIndex]) {
      if (this.sprite) {
        this.sprite.spriteFrame = this.tileSprites[tile.colorIndex];
      }
      if (this.label) {
        this.label.string = "";
      }
    } else {
      // Fallback: show index letter
      if (this.label) {
        this.label.string = String(tile.colorIndex);
      }
    }
  }

  playBurnAnimation(): Promise<void> {
    return new Promise(resolve => {
      const fade = cc.fadeOut(this.burnDuration);
      const scale = cc.scaleTo(this.burnDuration, 0);
      const sequence = cc.sequence(
        cc.spawn(fade, scale),
        cc.callFunc(() => {
          this._resetVisualState();
          resolve();
        })
      );
      
      this.node.runAction(sequence);
    });
  }

  playDropAnimation(targetPosition: cc.Vec2, delay: number = 0): Promise<void> {
    return new Promise(resolve => {
      const move = cc.moveTo(this.dropDuration, targetPosition)
        .easing(cc.easeCubicActionOut());
      
      const sequence = cc.sequence(
        cc.delayTime(delay),
        move,
        cc.callFunc(() => resolve())
      );
      
      this.node.runAction(sequence);
    });
  }

  getPosition(): IPosition {
    return {
      row: this.gridR,
      column: this.gridC
    };
  }

  setPosition(position: IPosition): void {
    this.gridR = position.row;
    this.gridC = position.column;
  }

  isActive(): boolean {
    return this.node.active;
  }

  setActive(active: boolean): void {
    this.node.active = active;
  }

  private _resetVisualState(): void {
    this.node.active = false;
    this.node.setScale(1);
    this.node.opacity = 255;
  }

  // Getters for backward compatibility
  get tileData(): ITile | null { return this._tileData; }
}
