import { computeReviewTotals } from './computeReviewTotals';
import { getAllPeerGivenVerdictsFromFiles } from './peer/getAllPeerGivenVerdictsFromFiles';

/**
 * .what = gets total blockers and nitpicks across a set of review files
 * .why = aggregates counts across multiple review files for threshold check
 *
 * .note = a `get*`, never a `compute*`: it reads the disk. the read routes through the
 *         named gather getAllPeerGivenVerdictsFromFiles, so this body only composes
 *         a read and a pure sum
 *
 * .note = 🔴 an unreadable count gates as ONE blocker, through the shared cast
 *         (asPeerGivenVerdict), never as 0. a 0 is what a clean review carries, so a fold to
 *         0 would let the threshold pass a stone on a verdict nobody could read
 *         (contract.reviewer-output: "it can NOT assume zero")
 *
 * .note = a file a rewind deleted since enumeration contributes naught — it is no longer a
 *         review of this stone, so it holds no verdict to read
 */
export const getOneReviewTotalsFromFiles = async (input: {
  reviewFiles: string[];
}): Promise<{ totalBlockers: number; totalNitpicks: number }> => {
  // read each file's verdict; a deleted file yields none
  const verdicts = await getAllPeerGivenVerdictsFromFiles({
    files: input.reviewFiles,
  });

  // sum the verdicts into the stone-wide tally
  return computeReviewTotals({ verdicts });
};
