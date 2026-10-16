import type { ReviewPrefixBreak } from '@src/domain.operations/review/meter/ReviewPrefixPair';

/**
 * .what = where a round pair's shared prefix parts — inside the static head, out in the
 *         per-round tail, or nowhere because the later prompt matched whole
 * .why = a prefix that parts in the head names a lever: the rubric, a brief, or the
 *        focus changed between rounds. one that parts in the tail is the expected shape,
 *        since the per-round bytes ride behind the head by design
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
