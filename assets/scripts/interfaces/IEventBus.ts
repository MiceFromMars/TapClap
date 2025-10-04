import { IGameEvent } from "../types";

export interface IEventBus {
  subscribe<T>(eventType: string, callback: (event: IGameEvent & { data: T }) => void): void;
  unsubscribe(eventType: string, callback: Function): void;
  publish<T>(eventType: string, data: T): void;
  clear(): void;
}

