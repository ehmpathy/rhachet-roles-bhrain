import type { ReviewRubricResult } from './ReviewByResult';

/**
 * .what = sums blockers + nitpicks across the in-memory rubric results
 * .why = the aggregate the cli exits on (blockersTotal > 0 → exit 2) and stdout prints as the
 *        guard-parseable summary. pure in-memory sum — no file re-read, so the counts cannot
 *        drift from the results already tallied.
 */
export const computeReviewRubricTotals = (input: {
  results: ReviewRubricResult[];
}): { blockersTotal: number; nitpicksTotal: number } => {
  const blockersTotal = input.results.reduce(
    (sum, result) => sum + result.verdict.blockers,
    0,
  );
  const nitpicksTotal = input.results.reduce(
    (sum, result) => sum + result.verdict.nitpicks,
    0,
  );
  return { blockersTotal, nitpicksTotal };
};
