export interface IGameEvent {
  readonly type: string;
  readonly data: any;
  readonly timestamp: number;
}
