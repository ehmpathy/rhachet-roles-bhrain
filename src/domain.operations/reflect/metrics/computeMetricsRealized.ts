import { asIsoPriceHuman, type IsoPriceHuman, sumPrices } from 'iso-price';
import { type IsoDuration, toMilliseconds } from 'iso-time';
import type { BrainOutputMetrics } from 'rhachet';

/**
 * .what = token metrics for a reflect step
 * .why = enables token usage track
 */
export interface ReflectStepTokenMetrics {
  input: number;
  cacheWrite: number;
  cacheRead: number;
  output: number;
}

/**
 * .what = cost metrics for a reflect step
 * .why = enables cost track with human-readable prices
 */
export interface ReflectStepCostMetrics {
  input: IsoPriceHuman;
  cacheWrite: IsoPriceHuman;
  cacheRead: IsoPriceHuman;
  output: IsoPriceHuman;
  total: IsoPriceHuman;
}

/**
 * .what = formats milliseconds as human words (e.g., "2m 15s")
 * .why = enables display of total time from summed ms
 */
const formatMillisecondsAsWords = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainderMinutes = minutes % 60;
  const remainderSeconds = seconds % 60;

  // format based on magnitude
  if (hours > 0) return `${hours}h ${remainderMinutes}m`;
  if (minutes > 0) return `${minutes}m ${remainderSeconds}s`;
  return `${seconds}s`;
};

/**
 * .what = computes actual metrics from brain responses
 * .why = enables accurate cost track after execution
 */
export const computeMetricsRealized = (input: {
  step1: { metrics: BrainOutputMetrics };
  step2: { metrics: BrainOutputMetrics };
}): {
  step1: {
    tokens: ReflectStepTokenMetrics;
    cost: ReflectStepCostMetrics;
    time: IsoDuration;
  };
  step2: {
    tokens: ReflectStepTokenMetrics;
    cost: ReflectStepCostMetrics;
    time: IsoDuration;
  };
  total: {
    tokens: ReflectStepTokenMetrics;
    cost: ReflectStepCostMetrics;
    time: string;
  };
} => {
  // extract step 1 metrics
  const step1Tokens: ReflectStepTokenMetrics = {
    input: input.step1.metrics.size.tokens.input,
    cacheWrite: input.step1.metrics.size.tokens.cache.set,
    cacheRead: input.step1.metrics.size.tokens.cache.get,
    output: input.step1.metrics.size.tokens.output,
  };
  const step1Cost: ReflectStepCostMetrics = {
    input: asIsoPriceHuman(input.step1.metrics.cost.cash.deets.input),
    cacheWrite: asIsoPriceHuman(input.step1.metrics.cost.cash.deets.cache.set),
    cacheRead: asIsoPriceHuman(input.step1.metrics.cost.cash.deets.cache.get),
    output: asIsoPriceHuman(input.step1.metrics.cost.cash.deets.output),
    total: asIsoPriceHuman(input.step1.metrics.cost.cash.total),
  };

  // extract step 2 metrics
  const step2Tokens: ReflectStepTokenMetrics = {
    input: input.step2.metrics.size.tokens.input,
    cacheWrite: input.step2.metrics.size.tokens.cache.set,
    cacheRead: input.step2.metrics.size.tokens.cache.get,
    output: input.step2.metrics.size.tokens.output,
  };
  const step2Cost: ReflectStepCostMetrics = {
    input: asIsoPriceHuman(input.step2.metrics.cost.cash.deets.input),
    cacheWrite: asIsoPriceHuman(input.step2.metrics.cost.cash.deets.cache.set),
    cacheRead: asIsoPriceHuman(input.step2.metrics.cost.cash.deets.cache.get),
    output: asIsoPriceHuman(input.step2.metrics.cost.cash.deets.output),
    total: asIsoPriceHuman(input.step2.metrics.cost.cash.total),
  };

  // compute total tokens
  const totalTokens: ReflectStepTokenMetrics = {
    input: step1Tokens.input + step2Tokens.input,
    cacheWrite: step1Tokens.cacheWrite + step2Tokens.cacheWrite,
    cacheRead: step1Tokens.cacheRead + step2Tokens.cacheRead,
    output: step1Tokens.output + step2Tokens.output,
  };

  // compute total cost via iso price sum
  const totalCost: ReflectStepCostMetrics = {
    input: asIsoPriceHuman(
      sumPrices([
        input.step1.metrics.cost.cash.deets.input,
        input.step2.metrics.cost.cash.deets.input,
      ]),
    ),
    cacheWrite: asIsoPriceHuman(
      sumPrices([
        input.step1.metrics.cost.cash.deets.cache.set,
        input.step2.metrics.cost.cash.deets.cache.set,
      ]),
    ),
    cacheRead: asIsoPriceHuman(
      sumPrices([
        input.step1.metrics.cost.cash.deets.cache.get,
        input.step2.metrics.cost.cash.deets.cache.get,
      ]),
    ),
    output: asIsoPriceHuman(
      sumPrices([
        input.step1.metrics.cost.cash.deets.output,
        input.step2.metrics.cost.cash.deets.output,
      ]),
    ),
    total: asIsoPriceHuman(
      sumPrices([
        input.step1.metrics.cost.cash.total,
        input.step2.metrics.cost.cash.total,
      ]),
    ),
  };

  // compute total time via ms sum and format
  const totalMs =
    toMilliseconds(input.step1.metrics.cost.time) +
    toMilliseconds(input.step2.metrics.cost.time);
  const totalTime = formatMillisecondsAsWords(totalMs);

  return {
    step1: {
      tokens: step1Tokens,
      cost: step1Cost,
      time: input.step1.metrics.cost.time,
    },
    step2: {
      tokens: step2Tokens,
      cost: step2Cost,
      time: input.step2.metrics.cost.time,
    },
    total: {
      tokens: totalTokens,
      cost: totalCost,
      time: totalTime,
    },
  };
};
