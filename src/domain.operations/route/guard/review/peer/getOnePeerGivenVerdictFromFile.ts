// review.tally/ is a declared shared exposure (see its .readme.md), never review's internals
import { getOneReviewCountsViaRegex } from '@src/domain.operations/review.tally/getOneReviewCountsViaRegex';

import { asPeerGivenVerdict } from './asPeerGivenVerdict';
import { getOneReviewArtifactContent } from './getOneReviewArtifactContent';

/**
 * .what = reads one review file and casts its verdict, or null if the file is gone
 * .why = names the per-file read + parse, so a gather over review files reads as one named
 *        call per file (rule.forbid.decode-friction-in-orchestrators)
 *
 * .note = 🔴 an unreadable count casts to ONE blocker through asPeerGivenVerdict, never 0
 *         (contract.reviewer-output: "it can NOT assume zero")
 * .note = a file a rewind deleted since enumeration reads as null — it holds no verdict
 */
export const getOnePeerGivenVerdictFromFile = async (input: {
  path: string;
}): Promise<{
  blockers: number;
  nitpicks: number;
  unreadable: boolean;
} | null> => {
  // read the file; a deleted file yields none
  const content = await getOneReviewArtifactContent({ path: input.path });
  if (content === null) return null;

  // cast the parsed counts into the verdict the gate compares on
  return asPeerGivenVerdict({
    counts: getOneReviewCountsViaRegex({ content }),
  });
};
