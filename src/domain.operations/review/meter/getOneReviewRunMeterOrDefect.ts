import type { ReviewRunMeter } from '@src/domain.objects/Reviewer/ReviewRunMeter';
import { asReviewRunMeterOfDefectOrRethrow } from '@src/domain.operations/review/meter/asReviewRunMeterOfDefectOrRethrow';
import { getOneReviewRunMeter } from '@src/domain.operations/review/meter/getOneReviewRunMeter';

/**
 * .what = meters one run dir, and turns a corrupt ARTIFACT into an `unknown` row
 * .why = three callers meter one run and must isolate a bad artifact the same
 *        way: the corpus read, the latest-run read, the named-run read. one copy
 *        of this catch had drifted to catch all, so a defect in the meter's own
 *        code rendered as one plausible `unknown` row rather than crash loud.
 *        one home, so no copy can drift again.
 *
 * .note = only an ARTIFACT defect becomes a row; every other class is a defect in
 *         this code and rethrows as itself (asReviewRunMeterOfDefectOrRethrow)
 */
export const getOneReviewRunMeterOrDefect = async (input: {
  dir: string;
  /** also place the target mass by directory — see `getOneReviewRunMeter` */
  withLocus: boolean;
}): Promise<ReviewRunMeter> => {
  try {
    return await getOneReviewRunMeter({
      dir: input.dir,
      withLocus: input.withLocus,
    });
  } catch (error) {
    return asReviewRunMeterOfDefectOrRethrow({ dir: input.dir, error });
  }
};
