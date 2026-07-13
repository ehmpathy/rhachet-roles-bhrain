/**
 * .what = the shared prefix of the persisted "tallied by reviewer@$brain" footer line
 * .why = ONE constant referenced by the writer (runOneStoneGuardReview), both renders
 *        (formatGuardReviewerTree, formatRouteStoneEmit), and this parser — so a copy tweak
 *        to the rendered phrase moves the parse contract in lockstep and cannot silently
 *        break tactic-recovery on a cache re-read (rule.require.single-source-of-truth-for-render).
 */
export const TALLIED_FOOTER_PREFIX = 'tallied by reviewer@';

/**
 * .what = recovers which tactic yielded a persisted review's tally, from its stored content
 * .why = the artifact object holds `tactic` in-memory, but only the reviewer's raw stdout/stderr
 *        (plus the tally footer) is persisted to file. on a cache re-read, this pure leaf
 *        recovers the tactic from the presence of the `tallied by reviewer@…` footer line:
 *        present → probabilistic (a sub-brain tallied it), absent → deterministic (read verbatim).
 *        both cache readers share THIS fn, not an inline regex, so the parse lives in one place.
 */
export const getReviewTacticFromContent = (input: {
  content: string;
}): 'deterministic' | 'probabilistic' => {
  return input.content.includes(TALLIED_FOOTER_PREFIX)
    ? 'probabilistic'
    : 'deterministic';
};
