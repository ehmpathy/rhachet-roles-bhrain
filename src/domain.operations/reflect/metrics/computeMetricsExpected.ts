/**
 * .what = estimates tokens and cost before reflect execution
 * .why = enables context window check and cost preview
 *
 * .note = cost estimates use hardcoded sonnet prices
 *         todo: expose prices via rhachet BrainAtom/BrainRepl for accurate estimates
 */
export const computeMetricsExpected = (input: {
  step1PromptTokens: number;
  step2PromptTokens: number;
}): {
  tokens: number;
  contextWindowPercent: number;
  cost: number;
} => {
  // claude sonnet context window is 200k tokens
  const contextWindow = 200_000;

  // estimate output tokens as ~30% of input
  const estimatedOutputTokens =
    (input.step1PromptTokens + input.step2PromptTokens) * 0.3;

  // total tokens includes input + estimated output
  const tokens =
    input.step1PromptTokens + input.step2PromptTokens + estimatedOutputTokens;

  // context window usage as percentage
  const contextWindowPercent = (tokens / contextWindow) * 100;

  // claude sonnet pricing: $3/1M input, $15/1M output
  const inputCost =
    ((input.step1PromptTokens + input.step2PromptTokens) / 1_000_000) * 3;
  const outputCost = (estimatedOutputTokens / 1_000_000) * 15;
  const cost = inputCost + outputCost;

  return {
    tokens: Math.round(tokens),
    contextWindowPercent: Math.round(contextWindowPercent * 100) / 100,
    cost: Math.round(cost * 1000) / 1000,
  };
};
