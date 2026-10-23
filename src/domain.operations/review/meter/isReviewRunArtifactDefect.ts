import { ReviewRunArtifactError } from '@src/domain.operations/review/ReviewRunArtifactError';
import { getAllErrorClassNames } from '@src/utils/getAllErrorClassNames';

/**
 * .what = whether an error is a defect in a review run's ARTIFACTS, as the meter raises it
 * .why = the meter isolates each run, so one corrupt log dir cannot deny a report its
 *        other rows. that isolation is an allowlist, never a catch-all: every artifact
 *        defect the reader raises — present-but-unparseable json, a cost with no
 *        tokens, an unreadable file — is a
 *        `ReviewRunArtifactError`. any other class, the generic
 *        `UnexpectedCodePathError` of an unhandled branch included, is a defect in the
 *        meter's own code, and it must surface as itself, never as one `unknown` row
 *        among many (rule.forbid.failhide)
 * .note = it reads the class by NAME off the prototype chain, never `instanceof`, for the
 *         realm reason `getAllErrorClassNames` names: an error that crosses a vm boundary or
 *         a second copy of the error library answers `instanceof` false while its
 *         constructor name survives
 */
export const isReviewRunArtifactDefect = (input: { error: unknown }): boolean =>
  getAllErrorClassNames({ error: input.error }).includes(
    ReviewRunArtifactError.name,
  );
