import type { GuardPeerMeterStatus } from '../../../tree/formatGuardTree';
import { isReviewPeerVerdictExhausted } from './isReviewPeerVerdictExhausted';

/**
 * .what = the slugs of the reviewers whose verdict is `exhausted`, optionally minus any at a
 *         forgiven (overruled) level
 * .why = two call sites read "which reviewers exhausted their budget" from a meter list — the
 *        passage flow (to name the skipped reviewers in the exhausted-block reason) and the
 *        drive-status message (to render the live exhausted set). both walked the same
 *        `filter(exhausted).map(slug)` pipeline inline; a named transformer keeps the orchestrators
 *        as narrative (rule.forbid.inline-decode-friction) and the read single-sourced
 *        (rule.prefer.wet-over-dry).
 *
 * .note = `overruledLevels` is required (an empty set means "exclude none"). the drive-status read
 *         passes `new Set()` — it reports every exhausted reviewer. the passage read passes the live
 *         overruled set — a reviewer at a forgiven level drops out (an overruled level is waved
 *         through and must not count as a skipped-by-exhaustion reviewer). required, not optional,
 *         per rule.forbid.undefined-inputs: the empty set is the explicit "none" value.
 */
export const getExhaustedReviewerSlugs = (input: {
  meters: GuardPeerMeterStatus[];
  overruledLevels: Set<number>;
}): string[] =>
  input.meters
    .filter(
      (meter) =>
        isReviewPeerVerdictExhausted(meter.verdict) &&
        !input.overruledLevels.has(meter.level),
    )
    .map((meter) => meter.slug);
