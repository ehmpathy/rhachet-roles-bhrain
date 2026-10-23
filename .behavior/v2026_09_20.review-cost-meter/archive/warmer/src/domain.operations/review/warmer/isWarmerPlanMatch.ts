import type { ReviewWarmerPlan } from './asReviewWarmerPlan';

/**
 * .what = whether a live warmer's plan is the plan this round asked for
 * .why = two renderers decide on it — whether the `found` line collapses, and
 *        whether the bound lines name a discarded plan. one predicate, so the two
 *        cannot disagree about what counts as a match
 *
 * .note = an unknown live plan (`null`) is never a match. it is a third state —
 *         the bound is unknowable — and each caller renders it as such
 */
export const isWarmerPlanMatch = (input: {
  live: ReviewWarmerPlan | null;
  asked: ReviewWarmerPlan;
}): boolean =>
  input.live !== null &&
  input.live.pokes === input.asked.pokes &&
  input.live.everyMinutes === input.asked.everyMinutes;
