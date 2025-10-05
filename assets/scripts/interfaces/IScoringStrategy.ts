import { IScoringConfig } from "./IGameConfig";

export interface IScoringStrategy {
  calculateScore(groupSize: number): number;
  calculateBonusScore(groupSize: number): number;
  getTotalScore(groupSize: number): number;
}



