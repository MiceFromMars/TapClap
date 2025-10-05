import { IEventBus } from "./interfaces/IEventBus";
import { IGameEvent } from "./interfaces/IGameEvent";

export class EventBus implements IEventBus {
  private readonly _listeners = new Map<string, Set<Function>>();

  subscribe<T>(eventType: string, callback: (event: IGameEvent & { data: T }) => void): void {
    if (!this._listeners.has(eventType)) {
      this._listeners.set(eventType, new Set());
    }
    this._listeners.get(eventType)!.add(callback);
  }

  unsubscribe(eventType: string, callback: Function): void {
    const listeners = this._listeners.get(eventType);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this._listeners.delete(eventType);
      }
    }
  }

  publish<T>(eventType: string, data: T): void {
    const listeners = this._listeners.get(eventType);
    if (listeners) {
      const event: IGameEvent & { data: T } = {
        type: eventType,
        data,
        timestamp: Date.now()
      };
      
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error);
        }
      });
    }
  }

  clear(): void {
    this._listeners.clear();
  }
}

// Singleton instance
export const gameEventBus = new EventBus();
