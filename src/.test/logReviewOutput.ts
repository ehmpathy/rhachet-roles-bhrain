import { logOutputHead } from './logOutputHead';

/**
 * .what = logs the first N lines of review output for test observability
 * .why = enables quick view of brain output without full scroll
 */
export const logReviewOutput = (input: {
  formatted: string;
  lines?: number;
}): void => {
  logOutputHead({
    label: 'review.formatted',
    output: input.formatted,
    lines: input.lines,
  });
};
