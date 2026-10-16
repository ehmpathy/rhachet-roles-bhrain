import type { ReviewRunMeter } from '@src/domain.objects/Reviewer/ReviewRunMeter';

/**
 * .what = whether a run's spend is known — metered, or refused
 * .why = the shared predicate under the accounted count and the accounted cost.
 *        stated once so a third grade cannot drift the two apart
 *        (rule.prefer.most-common-denominator).
 *
 * .note = a refused run never reached the brain, so its nil cost is a fact,
 *         not an absence — it folds into a figure where an unknown run cannot.
 *
 * .note = input is `Pick`ed to `grade` so a test fixture builds `{ grade }` with
 *         no cast over a partial `ReviewRunMeter` (rule.require.shapefit).
 */
export const isRunAccounted = (input: {
  run: Pick<ReviewRunMeter, 'grade'>;
}): boolean => input.run.grade === 'metered' || input.run.grade === 'refused';
