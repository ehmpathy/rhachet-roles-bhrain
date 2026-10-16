/**
 * .what = the body a target's diff block carries — an addition's whole file, a
 *         mutation's hunks, or none for a deletion
 * .why = the renderer and the token-breakdown fold must agree on what a diff
 *        block sends. an addition sends its plain body, never git's `+`-prefixed
 *        form; a deletion is a void tag with no body. one transformer, read by
 *        both, so the estimate cannot drift from the render
 *        (rule.require.single-source-of-truth-for-render).
 */
export const asTargetDiffBody = (input: {
  target: {
    content: string | null;
    diff?: string | null;
    changeKind?: 'new' | 'edited' | 'deleted';
  };
}): string => {
  if (input.target.changeKind === 'deleted') return '';
  if (input.target.changeKind === 'new') return input.target.content ?? '';
  return input.target.diff ?? '';
};
