/**
 * .what = whether a bash path names one place, known from the text alone
 * .why = `$D/a.md` and a relative `a.md` after a `cd` may land in memory; only an
 *        absolute or home path, with no expansion, is anchored before the shell runs
 */
export const isBashPathAnchored = (input: { path: string }): boolean =>
  !/[$`]/.test(input.path) && /^[/~]/.test(input.path);
