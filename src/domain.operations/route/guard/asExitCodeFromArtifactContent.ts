/**
 * .what = reads the exit code recorded in a guard artifact's content
 * .why = a persisted review/judge artifact records its process exit as `exit code: N` (a judge
 *        crash footer, a reviewed? tally footer). three call sites re-derived this same parse
 *        independently (the judge-verdict reader, the judge reason parser, the tree-bucket parser)
 *        — a re-derivation of one fact that can drift. one transformer holds the pattern
 *        (rule.require.single-source-of-truth-for-render / rule.forbid.duplicate-format-tree-operations).
 *
 * .note = the colon is optional and the match is case-insensitive, so it reads both
 *         `exit code: 2` and `exit code 2`. an absent code reads as 0 (passed) — an absent footer
 *         means the process did not record a non-zero exit.
 *
 * @example asExitCodeFromArtifactContent({ content: '... exit code: 2 ...' }) -> 2
 * @example asExitCodeFromArtifactContent({ content: 'no footer here' }) -> 0
 */
export const asExitCodeFromArtifactContent = (input: {
  content: string;
}): number => {
  const match = input.content.match(/exit code:?\s*(\d+)/i);
  return match?.[1] ? parseInt(match[1], 10) : 0;
};
