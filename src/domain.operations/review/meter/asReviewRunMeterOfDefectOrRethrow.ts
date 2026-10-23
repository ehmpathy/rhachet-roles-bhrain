import type { ReviewRunMeter } from '@src/domain.objects/Reviewer/ReviewRunMeter';
import { asReviewRunMeterOfDefect } from '@src/domain.operations/review/meter/asReviewRunMeterOfDefect';
import { isReviewRunArtifactDefect } from '@src/domain.operations/review/meter/isReviewRunArtifactDefect';

/**
 * .what = turns an error the meter raised into an `unknown` row — or rethrows it as itself
 * .why = the allowlist is the whole contract of per-run isolation: an artifact
 *        defect becomes one row that names it; any other class is a defect in the
 *        meter's own code and must surface loud, never as one plausible `unknown`
 *        row among many (isReviewRunArtifactDefect, rule.forbid.failhide)
 *
 * .note = pure, so the rethrow branch is clamped at the unit grain with no seam on the
 *         meter itself (rule.forbid.inject-same-repo-domain-ops)
 */
export const asReviewRunMeterOfDefectOrRethrow = (input: {
  dir: string;
  error: unknown;
}): ReviewRunMeter => {
  // a defect in this code, not in the artifacts — surface it as itself
  if (!isReviewRunArtifactDefect({ error: input.error })) throw input.error;

  // a corrupt artifact — one row that names its defect
  return asReviewRunMeterOfDefect({ dir: input.dir, error: input.error });
};
