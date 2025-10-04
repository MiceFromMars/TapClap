import { IScoringConfig } from "./types";
import { IScoringStrategy } from "./interfaces/IScoringStrategy";

export class DefaultScoringStrategy implements IScoringStrategy {
  constructor(private readonly _config: IScoringConfig) {}

  calculateScore(groupSize: number): number {
    if (groupSize < 2) return 0;
    return this._config.baseScore * (groupSize - 1);
  }

  calculateBonusScore(groupSize: number): number {
    if (groupSize < 3) return 0;
    const bonusMultiplier = Math.floor((groupSize - 2) / 2);
    return this._config.baseScore * bonusMultiplier * this._config.multiplier;
  }

  getTotalScore(groupSize: number): number {
    return this.calculateScore(groupSize) + this.calculateBonusScore(groupSize);
  }
}

export class LinearScoringStrategy implements IScoringStrategy {
  constructor(private readonly _config: IScoringConfig) {}

  calculateScore(groupSize: number): number {
    if (groupSize < 2) return 0;
    return this._config.baseScore * groupSize;
  }

  calculateBonusScore(groupSize: number): number {
    return 0; // No bonus for linear scoring
  }

  getTotalScore(groupSize: number): number {
    return this.calculateScore(groupSize);
  }
}

export class ExponentialScoringStrategy implements IScoringStrategy {
  constructor(private readonly _config: IScoringConfig) {}

  calculateScore(groupSize: number): number {
    if (groupSize < 2) return 0;
    return this._config.baseScore * Math.pow(groupSize, this._config.multiplier);
  }

  calculateBonusScore(groupSize: number): number {
    return 0; // Bonus is already included in exponential calculation
  }

  getTotalScore(groupSize: number): number {
    return this.calculateScore(groupSize);
  }
}

// Factory for creating scoring strategies
export class ScoringStrategyFactory {
  static createDefault(config: IScoringConfig): IScoringStrategy {
    return new DefaultScoringStrategy(config);
  }

  static createLinear(config: IScoringConfig): IScoringStrategy {
    return new LinearScoringStrategy(config);
  }

  static createExponential(config: IScoringConfig): IScoringStrategy {
    return new ExponentialScoringStrategy(config);
  }
}