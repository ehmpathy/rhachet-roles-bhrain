import { DomainLiteral } from 'domain-objects';

/**
 * .what = token usage and cost metrics for a reviewer reflect step
 * .why = enables cost track and context window management
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
  input: number;

  /**
   * cost for cache write
   */
  cacheWrite: number;

  /**
   * cost for cache read
   */
  cacheRead: number;

  /**
   * cost for output tokens
   */
  output: number;

  /**
   * total cost
   */
  total: number;
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
    };
    step2: {
      tokens: ReviewerReflectTokenMetrics;
      cost: ReviewerReflectCostMetrics;
    };
    total: {
      tokens: ReviewerReflectTokenMetrics;
      cost: ReviewerReflectCostMetrics;
    };
  };
}

export class ReviewerReflectMetrics
  extends DomainLiteral<ReviewerReflectMetrics>
  implements ReviewerReflectMetrics {}
