/**
 * .what = items grouped by a key, each group in the order its key first appears
 * .why = the inventory and repaid sections each sum rows per category or label, for one
 *        transcript and for a corpus; one linear pass replaces a filter per key, which
 *        grows with the square of the rows
 * .note = deliberate mutation: the map and its group lists are local to one pass; the
 *         output is a fresh array never mutated after return
 */
export const asGroupsByKey = <T>(input: {
  items: T[];
  keyOf: (item: T) => string;
}): T[][] => {
  const groupByKey = new Map<string, T[]>();
  for (const item of input.items) {
    const key = input.keyOf(item);
    const group = groupByKey.get(key);
    if (group) group.push(item);
    if (!group) groupByKey.set(key, [item]);
  }
  return [...groupByKey.values()];
};
