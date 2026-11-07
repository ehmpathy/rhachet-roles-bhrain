import type { ReviewPrefixBreak } from '@src/domain.operations/review/meter/ReviewPrefixPair';

/**
 * .what = where a round pair's shared prefix parts — inside the static head, out in the
 *         per-round tail, or nowhere because the later prompt matched whole
 * .why = the head is the instructions plus the corpus the level shares; the tail is the
 *        lane's own rubric, refs, partition band, and conversation. so a prefix that parts
 *        in the head means the instructions or a shared target changed between rounds —
 *        the expected shape of a repair round, whose cache the meet carries across lanes
 *        rather than the prior round. one that parts in the tail means the head held whole
 *        and the lane's own bytes moved behind it — a rubric edit, a new ref, or the
 *        conversation's growth
 *
 * .note = null where the head is not on record (a run older than the compiled census),
 *         and never a guess at which side it parted on
 */
export const asPrefixBreak = (input: {
  shared: { bytes: number; chars: number; laterBytes: number } | null;
  headChars: number | null;
}): ReviewPrefixBreak | null => {
  // no prefix measured, no place it parts
  if (input.shared === null) return null;

  // the later prompt matched its prior from end to end
  if (input.shared.bytes === input.shared.laterBytes) return 'whole';

  // the head is not on record, so the side is unknown
  if (input.headChars === null) return null;

  return input.shared.chars < input.headChars ? 'head' : 'tail';
};
