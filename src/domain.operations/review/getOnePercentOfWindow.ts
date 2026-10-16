/**
 * .what = the share of a brain's context window a prompt fills, as a percent
 * .why = the 60% warn and 75% failfast gates read this figure, so it is named once
 *        rather than computed inline where each reader must simulate it
 *
 * .note = unrounded on purpose: the gates compare against the exact figure, and
 *         only the render rounds (`getOnePercentRounded`)
 */
export const getOnePercentOfWindow = (input: {
  tokens: number;
  window: number;
}): number => (input.tokens / input.window) * 100;
