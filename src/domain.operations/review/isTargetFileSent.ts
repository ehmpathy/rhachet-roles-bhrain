/**
 * .what = whether a target's `<target.file>` body block reaches the prompt
 * .why = only an EDITED file sends a body — the context around its mutation. an
 *        added file's body IS its diff, so it renders once in the diff group as an
 *        addition; a deleted file has no body. to send either here too would pay
 *        for the same bytes twice
 *
 * .note = the file-axis twin of `isTargetDiffSent`. the renderer, the plan, and the
 *         census all read it — one home for the file-send question. the census
 *         still composes and measures on its own (`F11`), so the residual can catch
 *         the census and the renderer in disagreement
 */
export const isTargetFileSent = (input: {
  target: {
    content: string | null;
    changeKind?: 'new' | 'edited' | 'deleted';
  };
}): boolean =>
  input.target.content !== null &&
  input.target.changeKind !== 'new' &&
  input.target.changeKind !== 'deleted';
