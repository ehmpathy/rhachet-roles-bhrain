/**
 * .what = the first `cap` items as leaves, then one `(N more)` leaf for the rest
 * .why = a corpus list grows with the corpus — 500 paths, 2,000 rebases — and buries the
 *        report beneath it; the rest is named as a count, never dropped in silence
 */
export const asLeavesCapped = <TLeaf>(input: {
  items: TLeaf[];
  cap: number;
}): (TLeaf | string)[] => {
  // all fit, so all show
  if (input.items.length <= input.cap) return input.items;

  // the rest is a count the reader can see, never a silent cut
  const rest = input.items.length - input.cap;
  return [...input.items.slice(0, input.cap), `(${rest} more)`];
};
