import { UnexpectedCodePathError } from 'helpful-errors';

/**
 * .what = splits one flat list of reads back into the named groups it was poured from
 * .why = the seam between two shapes: a bounded pour must see one flat list
 *        so the bound is a property of the call, and the caller needs its
 *        groups back apart.
 *
 * .note = splits by count, positionally, never by a path match — two groups
 *         may legitimately name the same path (a file can be both a rule and
 *         a target), so a `find`-by-path split would drop a duplicate. counts
 *         cannot be ambiguous; paths can.
 *
 * .note = exported as a leaf: a cursor walked across a flat array is logic a
 *         reader must simulate, forbidden inside an orchestrator
 *         (`rule.forbid.inline-decode-friction`), and clampable out here at
 *         the grain where an off-by-one is visible.
 */
export const asReadsByGroup = <TGroup extends string, TRead>(input: {
  /** the group names, in the order their files were flattened */
  names: readonly TGroup[];
  /** how many files each group contributed */
  groups: Record<TGroup, string[]>;
  /** the flat reads, in the order asked */
  reads: readonly TRead[];
}): Record<TGroup, TRead[]> => {
  // a total that disagrees with the reads means the flatten and the split
  // walked different lists — fail loud rather than hand back short groups
  // (rule.require.failloud)
  const total = input.names.reduce(
    (sum, name) => sum + input.groups[name].length,
    0,
  );
  if (total !== input.reads.length)
    UnexpectedCodePathError.throw(
      'the reads do not match the groups they were poured from',
      { total, reads: input.reads.length },
    );

  // .note = deliberate mutation, and a SCOPED ZONE — the cursor is born here and does
  //         not escape. a `reduce` that carried both the cursor and the accumulator
  //         would read worse than the walk it replaced
  let at = 0;
  // .note = the `as` cast is the documented exception `rule.forbid.as-cast`
  //         permits: an empty literal cannot carry a `Record<TGroup, …>` until
  //         the walk below writes every key, and it does — `names` is exactly
  //         the key set `groups` declares, checked by the total above
  const byGroup = {} as Record<TGroup, TRead[]>;
  for (const name of input.names) {
    const count = input.groups[name].length;
    byGroup[name] = input.reads.slice(at, at + count);
    at += count;
  }
  return byGroup;
};
