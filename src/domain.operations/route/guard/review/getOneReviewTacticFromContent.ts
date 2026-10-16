import { getOneTalliedFooterLineFromContent } from './getOneTalliedFooterLineFromContent';

/**
 * .what = recovers which tactic yielded a persisted review's tally, from its stored content
 * .why = the artifact object holds `tactic` in-memory, but only the reviewer's raw stdout/stderr
 *        (plus the tally footer) is persisted to file. on a cache re-read, this pure leaf
 *        recovers the tactic from the presence of the `tallied by reviewer@…` footer line:
 *        present → probabilistic (a sub-brain tallied it), absent → deterministic (read verbatim).
 *        both cache readers share THIS fn, not an inline regex, so the parse lives in one place.
 */
export const getOneReviewTacticFromContent = (input: {
  content: string;
}): 'deterministic' | 'probabilistic' => {
  return getOneTalliedFooterLineFromContent({ content: input.content }) !== null
    ? 'probabilistic'
    : 'deterministic';
};
