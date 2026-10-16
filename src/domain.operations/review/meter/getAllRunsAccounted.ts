import type { ReviewRunMeter } from '@src/domain.objects/Reviewer/ReviewRunMeter';
import { isRunAccounted } from '@src/domain.operations/review/meter/isRunAccounted';

/**
 * .what = the runs whose spend is KNOWN — metered, or refused before the brain
 * .why = the one projection over `isRunAccounted`, so a bucket's accounted count and
 *        the accounted cost fold over the same runs by construction
 *
 * .note = generic over the one field it reads, so a caller that holds a `Pick`ed
 *         run gets its own shape back, with no cast (rule.require.shapefit)
 */
export const getAllRunsAccounted = <
  TRun extends Pick<ReviewRunMeter, 'grade'>,
>(input: {
  runs: TRun[];
}): TRun[] => input.runs.filter((run) => isRunAccounted({ run }));
