import {
  GRAMMAR_OF_PEER_REVIEW_OUTPUT,
  type PeerReviewOutputParts,
} from './asPeerReviewOutputName';

/**
 * .what = decomposes a peer review report filename back into its parts
 *
 * .why = the read half of the one grammar `asPeerReviewOutputName` writes by. the
 *        grammar is declared once beside this file and imported here, so the two halves
 *        read one declaration — and the round-trip clamp in
 *        `asPeerReviewOutputName.test.ts` turns red the moment they part.
 *
 * .note = answers null for a name this grammar did not write — a hand `rhx review`
 *         writes wherever it was told, so it has no guard identity, and an invented
 *         one would be worse than an absent one (rule.forbid.failhide).
 */
export const asPeerReviewOutputParts = (input: {
  name: string;
}): PeerReviewOutputParts | null => {
  const match = GRAMMAR_OF_PEER_REVIEW_OUTPUT.exec(input.name);
  if (!match?.groups) return null;

  const { stone, iteration, hash, index, slug } = match.groups;
  if (!stone || !iteration || !hash || !index || !slug) return null;

  return { stone, iteration, hash, index, slug };
};
