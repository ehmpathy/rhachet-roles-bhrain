import { HelpfulError } from 'helpful-errors';

// a sanctioned exposure, declared in src/domain.operations/review/.readme.md
import { asErrorMessage } from '@src/domain.operations/review/asErrorMessage';

// a sanctioned exposure, declared in src/domain.operations/review/.readme.md
import type { ReviewRun } from '../review/runOneReview';

/**
 * .what = checks whether a thrown value is a fault a rubric review is known to surface
 * .why = only these settle into a malfunction row: a HelpfulError the runner raised on
 *        purpose, or a node system error (string `code`, e.g. spawn ENOENT) from the
 *        subprocess boundary. any other throw — a TypeError, a RangeError — is a defect
 *        in our own code, and must reach the human as itself (rule.forbid.failhide)
 */
const isReviewRunSurfacedFault = (input: { error: unknown }): boolean => {
  if (input.error instanceof HelpfulError) return true;
  if (!(input.error instanceof Error)) return false;
  return 'code' in input.error && typeof input.error.code === 'string';
};

/**
 * .what = runs one rubric's review, and settles a surfaced fault into an undetected run
 * .why = review.by pours independent rubrics under one bound; a surfaced fault from one (a
 *        spawn fault, a runner malfunction) must not drop the verdicts its peers already
 *        returned (rule.forbid.dropped-partial-review-progress). an undetected run is what
 *        `asReviewVerdict` reads as `malfunctioned`, so the fault is named on its row and
 *        counted, never swallowed as a clean 0/0 (rule.forbid.failhide)
 *
 * .note = the reason rides on stderr as `💥 MalfunctionError: <message>`, which is the line
 *         `asReviewVerdict` surfaces as the malfunction reason. a throw outside the allowlist
 *         is rethrown, so a defect in our code is never mis-graded as a reviewer malfunction.
 *         the settled pour in `stepReviewBy` then keeps that rethrow from a drop of the
 *         wave: `asReviewRubricResultOfOutcome` names it as a review.by defect on its own row
 */
export const getOneReviewRunSettled = async (input: {
  operation: () => Promise<ReviewRun>;
}): Promise<ReviewRun> => {
  try {
    return await input.operation();
  } catch (error) {
    // rethrow any throw outside the allowlist — a code defect, never a reviewer fault
    if (!isReviewRunSurfacedFault({ error })) throw error;

    // a surfaced fault becomes an undetected run — a malfunction on its own row
    return {
      stdout: '',
      stderr: `💥 MalfunctionError: the rubric review threw before it returned a verdict: ${asErrorMessage({ error })}`,
      exitCode: 1,
      durationMs: null,
      blockers: 0,
      nitpicks: 0,
      tallier: null,
      talliedBy: null,
      detected: false,
    };
  }
};
