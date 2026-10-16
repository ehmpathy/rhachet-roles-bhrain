/**
 * .what = renders a prose body beneath a branch head — `└─` on the first line, aligned after
 * .why = both absorb prompts draw such bodies, and their inline copies had already DRIFTED: some
 *        called `.trimEnd()` and some did not, so a blank line in a body would have emitted
 *        whitespace past the last word (rule.forbid.snapshot-visual-blemishes). one render makes
 *        the trim a fact of the shape rather than a habit of each copy
 *        (rule.forbid.duplicate-format-tree-operations)
 */
export const asBranchBodyLines = (input: {
  indent: string;
  body: string[];
}): string[] =>
  input.body.map((line, i) =>
    `${input.indent}${i === 0 ? '└─' : '  '} ${line}`.trimEnd(),
  );
