/**
 * .what = merges the two APPROVED outcomes of a base review into one stable render
 * .why = a base review that approves renders one of two ways, by how many nitpicks the brain chose:
 *
 *          - none:      `🦉 not even a vole`, then `all good 👍` closes the summary
 *          - some:      `🦉 just a few hoots`, and the nitpick row closes the summary
 *
 *        both are approved, and a nitpick never turns the verdict, so no pass case turns on which
 *        one the brain drew. a snapshot that pins one of them reds the file on the other.
 *
 *        the approved CLASS stays pinned by `0 blockers` and the case's own exit or passage
 *        assertion. a blocker outcome (`🦉 needs your talons`) is left verbatim, since that is the
 *        verdict class a dirty case declares.
 *
 * .note = runs AFTER maskConcernMagnitudes, which turns `0 nitpicks` into `[N] nitpicks`.
 */
export const maskApprovedOutcome = (text: string): string =>
  text
    .replace(/🦉 (?:not even a vole|just a few hoots)/g, '🦉 [APPROVED]')
    .replace(/^(.*)├─ \[N\] nitpicks\n\1└─ all good 👍$/gm, '$1└─ [N] nitpicks');
