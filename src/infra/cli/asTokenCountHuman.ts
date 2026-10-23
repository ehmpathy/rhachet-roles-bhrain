/**
 * .what = a token count abbreviated for a human: `950`, `20.0k`, `1.2M`
 * .why = the review's token breakdowns and the reflector's spend report each render token
 *        counts; one owner keeps them read the same way
 */
export const asTokenCountHuman = (input: { tokens: number }): string => {
  if (input.tokens >= 1_000_000)
    return `${(input.tokens / 1_000_000).toFixed(1)}M`;
  if (input.tokens >= 1_000) return `${(input.tokens / 1_000).toFixed(1)}k`;
  return `${input.tokens}`;
};
