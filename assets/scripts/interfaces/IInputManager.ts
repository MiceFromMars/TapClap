export interface IInputManager {
  lock(): void;
  unlock(): void;
  isLocked(): boolean;
}

