import type { ReviewRunMeter } from '@src/domain.objects/Reviewer/ReviewRunMeter';

/**
 * .what = the runs whose tokens and spend were measured
 * .why = the one projection every token fold reads, so a meter bucket and a cache
 *        grade agree on which runs carry measured tokens by construction
 *
 * .note = generic over the one field it reads, so a caller that holds a `Pick`ed
 *         run gets its own shape back, with no cast (rule.require.shapefit)
 */
export const getAllRunsMetered = <
  TRun extends Pick<ReviewRunMeter, 'grade'>,
>(input: {
  runs: TRun[];
}): TRun[] => input.runs.filter((run) => run.grade === 'metered');
