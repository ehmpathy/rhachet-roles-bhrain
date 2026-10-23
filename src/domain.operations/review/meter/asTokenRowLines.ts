/**
 * .what = the four token rows — input, cache.set, cache.get, output — under one prefix
 * .why = the run and the tree surfaces render the same four rows, and only their
 *        figures differ: a run renders measured counts, a tree renders sums that
 *        may be absent. the skeleton — labels, order, alignment — has one home, so
 *        a fifth figure or a renamed label lands on both surfaces at once
 *        (rule.forbid.duplicate-format-tree-operations).
 *
 * .note = each figure arrives rendered. the absent decision differs per surface,
 *         and that decision is the caller's; this owns the row shape alone.
 */
export const asTokenRowLines = (input: {
  prefix: string;
  figures: {
    input: string;
    cacheSet: string;
    cacheGet: string;
    output: string;
  };
}): string[] => [
  `${input.prefix}├─ input:     ${input.figures.input}`,
  `${input.prefix}├─ cache.set: ${input.figures.cacheSet}`,
  `${input.prefix}├─ cache.get: ${input.figures.cacheGet}`,
  `${input.prefix}└─ output:    ${input.figures.output}`,
];
