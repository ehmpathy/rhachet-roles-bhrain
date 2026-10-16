import { asTreeCauseLines } from './asTreeCauseLines';

/**
 * .what = the note `rhx review --open` prints when the opener program did not run
 * .why = the opener is the caller's own `--open` value, so the caller must act: the
 *        first line names the class (`rule.require.qualified-error-headers`), which keys
 *        on who must act, never on the exit code. the review is already on disk, so the
 *        process still exits 0, and the path to open by hand is the fix
 *        (`rule.require.errors-name-the-fix`)
 *
 * .note = one law across every exit-0 aside of the review drive: a `✋ ConstraintError:`
 *         header means "an act you asked for was not served, and you can fix it" — never
 *         "the command failed". a census over an empty
 *         corpus wears none: no ask went unserved, an absent corpus is the answer. so the
 *         exit code says whether the command failed, and the class says who must act (F72)
 */
export const asOpenerFailureNote = (input: {
  opener: string;
  output: string;
  cause: string;
}): string =>
  [
    `✋ ConstraintError: the review is written, but the opener '${input.opener}' did not run`,
    ...asTreeCauseLines({ cause: input.cause }),
    `   └─ fix: open it by hand, or pass an --open program on your PATH`,
    `      └─ ${input.output}`,
  ].join('\n');
