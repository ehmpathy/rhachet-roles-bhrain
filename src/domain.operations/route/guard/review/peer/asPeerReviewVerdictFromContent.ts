import { asDurationMsFromContent } from '@src/domain.operations/asDurationMsFromContent';
// review.tally/ is a declared shared exposure (see its .readme.md), never review's internals
import { getOneReviewCountsViaRegex } from '@src/domain.operations/review.tally/getOneReviewCountsViaRegex';

import { asExitCodeClass } from '../../asExitCodeClass';
import { asExitCodeFromArtifactContent } from '../../asExitCodeFromArtifactContent';
import { getOneReviewTacticFromContent } from '../getOneReviewTacticFromContent';
import { getOneTalliedBrainFromContent } from '../getOneTalliedBrainFromContent';
import { asPeerGivenVerdict } from './asPeerGivenVerdict';

/**
 * .what = reads the verdict fields a persisted peer review carries in its content
 * .why = two readers rebuild a review artifact from disk — the current-hash cache and
 *        the cross-hash fallback for an exhausted reviewer. each once parsed the fields
 *        by hand, so a verdict rule changed in one and not the other: an unreadable
 *        tally read `0/0` on one path and `1 blocker` on the other, for a file nobody
 *        touched. one transformer owns the fields, so a rule changes in one place
 *
 * .note = an unreadable tally gates as one blocker, never a clean 0/0
 *         (rule.forbid.failhide, via `asPeerGivenVerdict`, the cast the live gate uses)
 * .note = that cast applies only to a review that RAN (exit 0). a constraint or a
 *         malfunction exit writes no tally by contract — its exit class IS its verdict,
 *         and it gates on that class. to fabricate a blocker there turns a genuine
 *         constraint (exit 2, no blockers) into a `rejected` lane, which drains budget
 *         and owes a `.taken` for a concern no reviewer raised
 */
export const asPeerReviewVerdictFromContent = (input: { content: string }) => {
  // the exit, read from the tree bucket format
  const exitCode = asExitCodeFromArtifactContent({ content: input.content });
  const exitClass = asExitCodeClass({ code: exitCode });

  // the counts: a review that ran is cast as the live gate casts it; a review that
  // could not run carries no tally, so its counts are the zeros it never reported
  const counts = getOneReviewCountsViaRegex({ content: input.content });
  const { blockers, nitpicks } =
    exitClass === 'passed' || counts.detected
      ? asPeerGivenVerdict({ counts })
      : { blockers: 0, nitpicks: 0 };

  return {
    blockers,
    nitpicks,
    // the internal tactic lands on the contract `tallier` field
    tallier: getOneReviewTacticFromContent({ content: input.content }),
    // the pin the footer recorded, so a render names the model that ran
    talliedBy: getOneTalliedBrainFromContent({ content: input.content }),
    durationMs: asDurationMsFromContent({ content: input.content }),
    exitCode,
    exitClass,
  };
};
