/**
 * .what = the output tokens a review is expected to emit, from its prompt size
 * .why = the pre-run cost estimate needs an output figure before any output exists.
 *        a review answers in a report far smaller than what it reads, so the
 *        assumption is ~10% of input — stated once, where a reader can find it
 */
export const getOneEstimatedOutputTokens = (input: {
  tokens: number;
}): number => Math.round(input.tokens * 0.1);
