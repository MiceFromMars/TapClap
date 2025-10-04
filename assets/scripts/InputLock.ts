import { IEventBus } from "./interfaces/IEventBus";
import { IInputManager } from "./interfaces/IInputManager";
import { GameEvents } from "./GameEvents";

export class InputManager implements IInputManager {
  private _locked = false;

  constructor(private readonly _eventBus: IEventBus) {}

  lock(): void {
    if (!this._locked) {
      this._locked = true;
      this._eventBus.publish(GameEvents.INPUT_LOCKED, {});
    }
  }

  unlock(): void {
    if (this._locked) {
      this._locked = false;
      this._eventBus.publish(GameEvents.INPUT_UNLOCKED, {});
    }
  }

  isLocked(): boolean {
    return this._locked;
  }
}

// Singleton instance for backward compatibility
let _inputManager: IInputManager | null = null;

export function initializeInputManager(eventBus: IEventBus): void {
  _inputManager = new InputManager(eventBus);
}

export function getInputManager(): IInputManager {
  if (!_inputManager) {
    throw new Error("InputManager not initialized. Call initializeInputManager first.");
  }
  return _inputManager;
}

// Legacy static class for backward compatibility
export default class InputLock {
  static lock(): void {
    getInputManager().lock();
  }

  static unlock(): void {
    getInputManager().unlock();
  }

  static get isLocked(): boolean {
    return getInputManager().isLocked();
  }
}
