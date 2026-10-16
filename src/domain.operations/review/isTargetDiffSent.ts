/**
 * .what = whether a target's `<target.diff>` block actually reaches the prompt
 * .why = the renderer decides which targets send a diff, and the census must
 *        count exactly those, or a diff measured but never rendered inflates
 *        `targetDiffs.*` and `markup` (the residual) absorbs the difference as a
 *        negative — every row still sums to `chars`, so no assertion catches it
 *        (rule.require.distinguish-every-review-input)
 *
 * .note = every change kind is a diff on this branch, so every kind sends one:
 *         - `new` → an ADDITION: the file's whole body, labeled `kind="+"`
 *         - `deleted` → a DELETION: a void tag, labeled `kind="-"`
 *         - `edited` → a MUTATION: the hunks against the range base, labeled `kind="~"`
 *         the one case that sends none is a target with no change kind and no
 *         diff — a file in scope by `--paths` alone, which is context, not a delta.
 *
 * .note = three callers read this, and each matters: `compileReviewPrompt`
 *         (the renderer, which decides), `getOnePromptComposition` (the
 *         census, which counts), `stepReview` (the token-breakdown estimate).
 *         an extracted decision binds only the call sites wired to it — a new
 *         reader of a target's diff belongs on this list before it ships
 */
export const isTargetDiffSent = (input: {
  target: {
    content: string | null;
    diff?: string | null;
    changeKind?: 'new' | 'edited' | 'deleted';
  };
}): boolean => {
  const { target } = input;

  // an added or deleted file IS its diff — the whole body, or a marker of absence
  if (target.changeKind === 'new') return true;
  if (target.changeKind === 'deleted') return true;

  // an edited file's diff is a real delta, and earns its place
  return target.diff !== undefined && target.diff !== null;
};
