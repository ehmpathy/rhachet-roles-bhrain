import type { ContextReviewBrainSupply } from '../../genReviewBrainSupply';
import { getReviewCountsViaBrain } from './getReviewCountsViaBrain';
import {
  getReviewCountsViaRegex,
  type ReviewCountsResolved,
} from './getReviewCountsViaRegex';

/**
 * .what = the root orchestrator — waterfalls the deterministic then probabilistic tactics
 * .why = the reviewer already did the hard part (read the repo, wrote its findings); we just
 *        need the tally. try the free exact regex first; only when it misses on a review that
 *        RAN (exit 0) do we pay a cheap sub-brain to read the small review text. a review with
 *        no verdict at all still returns { detected: false } → the caller promotes it to a
 *        malfunction, so failloud is preserved.
 *
 * .note = the exit-0 gate lives HERE so the orchestrator owns the COMPLETE tactic-selection
 *         logic: deterministic always, brain only on exit 0. a crashed reviewer (non-zero exit)
 *         is never rescued by a brain.
 */
export const getReviewCounts = async (
  input: { content: string; exitCode: number },
  context: ContextReviewBrainSupply,
): Promise<ReviewCountsResolved> => {
  // deterministic first — free, exact
  const countsViaRegex = getReviewCountsViaRegex({ content: input.content });
  if (countsViaRegex.detected)
    return { ...countsViaRegex, tactic: 'deterministic' };

  // only rescue a review that RAN (exit 0) but phrased its verdict oddly
  if (input.exitCode !== 0) return { detected: false };

  // probabilistic fallback — cheap sub-brain reads the small review text
  const countsViaBrain = await getReviewCountsViaBrain(
    { content: input.content },
    context,
  );
  if (countsViaBrain.detected)
    return { ...countsViaBrain, tactic: 'probabilistic' };

  // neither tactic found a verdict — the false branch carries no counts to fake
  return { detected: false };
};
