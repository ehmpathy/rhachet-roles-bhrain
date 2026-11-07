/**
 * .what = the leaves a tree row hangs beneath it, one per fact — `├─` on each, `└─` on the last
 * .why = the tree and the grove reports both hang facts beneath a brain row, and each drew the
 *        glyphs inline. one render, so the stem beside the leaves and the leaf markers cannot
 *        drift apart across the two (rule.forbid.duplicate-format-tree-operations)
 *
 * .note = `indent` is the text ahead of the row's own `├─` / `└─`. the row's stem runs down
 *         beside its leaves unless the row is the last of its branch
 * .note = lifted at two callers, before the third that wet-over-dry would wait for: for a
 *         tree render, `rule.forbid.duplicate-format-tree-operations` is a blocker in this
 *         repo, and it outranks a nitpick-grade preference to stay wet
 */
export const asLeafLinesOfRow = (input: {
  indent: string;
  isLastRow: boolean;
  leaves: string[];
}): string[] =>
  input.leaves.map(
    (leaf, at) =>
      `${input.indent}${input.isLastRow ? '   ' : '│  '}${at === input.leaves.length - 1 ? '└─' : '├─'} ${leaf}`,
  );
