import { getOneReviewMetricsOfZero } from '@src/domain.operations/review/getOneReviewMetricsOfZero';
import type { StepReviewResult } from '@src/domain.operations/review/StepReviewResult';

/**
 * .what = the result of a `--mode plan` run — the split it previewed, at zero cost
 * .why = a plan calls no brain and grades naught, so its counts and spend are a real zero,
 *        and its outcome says so, so a caller never reads a plan as a clean review
 */
export const asReviewResultOfPlan = (input: {
  formatted: string;
  logDir: string;
  output: string;
}): StepReviewResult => ({
  outcome: 'planned',
  review: { formatted: input.formatted },
  log: { dir: input.logDir },
  output: { path: input.output },
  summary: { blockersCount: 0, nitpicksCount: 0 },
  metrics: getOneReviewMetricsOfZero(),
});
