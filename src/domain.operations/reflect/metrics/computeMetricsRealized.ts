import type {
  ReviewerReflectCostMetrics,
  ReviewerReflectTokenMetrics,
} from '@src/domain.objects/Reviewer/ReviewerReflectMetrics';

/**
 * .what = computes actual metrics from brain responses
 * .why = enables accurate cost track after execution
 */
export const computeMetricsRealized = (input: {
  step1: {
    tokens: ReviewerReflectTokenMetrics;
  };
  step2: {
    tokens: ReviewerReflectTokenMetrics;
  };
}): {
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
} => {
  // compute costs for step 1
  const step1Cost = computeStepCost(input.step1.tokens);

  // compute costs for step 2
  const step2Cost = computeStepCost(input.step2.tokens);

  // compute total tokens
  const totalTokens: ReviewerReflectTokenMetrics = {
    input: input.step1.tokens.input + input.step2.tokens.input,
    cacheWrite: input.step1.tokens.cacheWrite + input.step2.tokens.cacheWrite,
    cacheRead: input.step1.tokens.cacheRead + input.step2.tokens.cacheRead,
    output: input.step1.tokens.output + input.step2.tokens.output,
  };

  // compute total cost
  const totalCost: ReviewerReflectCostMetrics = {
    input: step1Cost.input + step2Cost.input,
    cacheWrite: step1Cost.cacheWrite + step2Cost.cacheWrite,
    cacheRead: step1Cost.cacheRead + step2Cost.cacheRead,
    output: step1Cost.output + step2Cost.output,
    total: step1Cost.total + step2Cost.total,
  };

  return {
    step1: {
      tokens: input.step1.tokens,
      cost: step1Cost,
    },
    step2: {
      tokens: input.step2.tokens,
      cost: step2Cost,
    },
    total: {
      tokens: totalTokens,
      cost: totalCost,
    },
  };
};

/**
 * .what = computes cost for a single step
 * .why = applies claude sonnet pricing to token counts
 */
const computeStepCost = (
  tokens: ReviewerReflectTokenMetrics,
): ReviewerReflectCostMetrics => {
  // claude sonnet pricing per 1M tokens:
  // - input: $3
  // - cache write: $3.75
  // - cache read: $0.30
  // - output: $15
  const inputCost = (tokens.input / 1_000_000) * 3;
  const cacheWriteCost = (tokens.cacheWrite / 1_000_000) * 3.75;
  const cacheReadCost = (tokens.cacheRead / 1_000_000) * 0.3;
  const outputCost = (tokens.output / 1_000_000) * 15;

  return {
    input: Math.round(inputCost * 10000) / 10000,
    cacheWrite: Math.round(cacheWriteCost * 10000) / 10000,
    cacheRead: Math.round(cacheReadCost * 10000) / 10000,
    output: Math.round(outputCost * 10000) / 10000,
    total:
      Math.round(
        (inputCost + cacheWriteCost + cacheReadCost + outputCost) * 10000,
      ) / 10000,
  };
};
