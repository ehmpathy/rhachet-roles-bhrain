/**
 * .what = the items with a distinct `key`, the FIRST of each key kept, in input order
 * .why = two reviewers that read one partition scope check it once; a named dedupe spares the
 *        reader the index arithmetic that keeps the first entry per key
 *
 * .note = first-wins is the contract: input order is the reviewers' declared order, so the
 *         kept entry is the one the earliest reviewer named
 */
export const getAllDistinctByKey = <TItem extends { key: string }>(input: {
  items: TItem[];
}): TItem[] =>
  input.items.filter(
    (item, index) =>
      input.items.findIndex((peer) => peer.key === item.key) === index,
  );
