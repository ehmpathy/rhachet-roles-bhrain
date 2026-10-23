import path from 'path';

import {
  GRAMMAR_OF_PEER_CONVERSATION_FILE,
  type PeerReviewOutputParts,
} from './asPeerReviewOutputName';

/**
 * .what = decomposes one peer conversation file — a given, its report, or a taken — back
 *         into its parts and the side of the dialogue it holds
 *
 * .why = the read half the conversation expander keys generations and lanes on. it reads
 *        `GRAMMAR_OF_PEER_CONVERSATION_FILE`, which shares its head with the grammar the
 *        guard writes by, so a rename of that grammar reaches every reader at once.
 *
 * .note = takes a path or a bare name; only the basename is parsed
 * .note = answers null for a name the grammar did not write, so the caller decides what an
 *         unreadable name means (rule.forbid.failhide)
 */
export const asPeerConversationFileParts = (input: {
  file: string;
}):
  | (PeerReviewOutputParts & { side: 'given' | 'taken'; report: boolean })
  | null => {
  const match = GRAMMAR_OF_PEER_CONVERSATION_FILE.exec(
    path.basename(input.file),
  );
  if (!match?.groups) return null;

  const { stone, iteration, hash, index, slug, side, report } = match.groups;
  if (!stone || !iteration || !hash || !index || !slug || !side) return null;

  return {
    stone,
    iteration,
    hash,
    index,
    slug,
    side: side === 'taken.by_self' ? 'taken' : 'given',
    report: report !== undefined,
  };
};
