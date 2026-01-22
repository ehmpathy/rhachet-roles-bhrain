import { DomainLiteral } from 'domain-objects';
import type { IsoPriceHuman } from 'iso-price';
import type { IsoDuration } from 'iso-time';

/**
 * .what = token usage metrics for a reviewer reflect step
 * .why = enables context window management
 */
export interface ReviewerReflectTokenMetrics {
  /**
   * input tokens sent to model
   */
  input: number;

  /**
   * tokens written to cache
   */
  cacheWrite: number;

  /**
   * tokens read from cache
   */
  cacheRead: number;

  /**
   * output tokens from model
   */
  output: number;
}

/**
 * .what = cost breakdown by token type for reviewer reflect
 * .why = enables cost analysis and optimization
 */
export interface ReviewerReflectCostMetrics {
  /**
   * cost for input tokens
   */
  input: IsoPriceHuman;

  /**
   * cost for cache write
   */
  cacheWrite: IsoPriceHuman;

  /**
   * cost for cache read
   */
  cacheRead: IsoPriceHuman;

  /**
   * cost for output tokens
   */
  output: IsoPriceHuman;

  /**
   * total cost
   */
  total: IsoPriceHuman;
}

/**
 * .what = complete metrics for reviewer reflect skill execution
 * .why = enables resource usage track across both steps
 */
export interface ReviewerReflectMetrics {
  /**
   * file counts
   */
  files: {
    feedbackCount: number;
    rulesCount: number;
  };

  /**
   * pre-invocation estimates
   */
  expected: {
    tokens: number;
    contextWindowPercent: number;
    cost: number;
  };

  /**
   * actual usage after completion
   */
  realized: {
    step1: {
      tokens: ReviewerReflectTokenMetrics;
      cost: ReviewerReflectCostMetrics;
      time: IsoDuration;
    };
    step2: {
      tokens: ReviewerReflectTokenMetrics;
      cost: ReviewerReflectCostMetrics;
      time: IsoDuration;
    };
    total: {
      tokens: ReviewerReflectTokenMetrics;
      cost: ReviewerReflectCostMetrics;
      time: string;
    };
  };
}

export class ReviewerReflectMetrics
  extends DomainLiteral<ReviewerReflectMetrics>
  implements ReviewerReflectMetrics {}
