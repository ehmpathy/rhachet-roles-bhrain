import { BASH_WORD_CHAR } from './BASH_WORD_CHAR';

/**
 * .what = pattern for a bash redirect that writes a file, with its target captured
 * .why = a bare `>` also appears in tokens that write no file; only a file redirect counts
 *
 * matches (a file redirect):
 * - `>` · `>>` · `>|` (noclobber override)
 * - with an optional fd or `&` before: `2> f` · `&> f` · `1>> f`
 * - `>& f` · `>&f` — both streams into a file, when the word is no fd
 *
 * refuses (no file is written):
 * - `>&N` · `N>&M` · `>&-` — an fd duplicate or close (`2>&1`, `>&2`)
 * - `=>` · `->` — arrows, as in a quoted grep pattern
 *
 * pattern breakdown:
 * - (?<![=\-<>]) = the `>` is not the tail of an arrow, nor the second `>` of `>>`
 * - >{1,2}\|? = the operator: `>`, `>>`, or `>|`
 * - (?!&[\d-]) = not an fd duplicate nor a close
 * - &? = the `>&` form that sends both streams to a file
 * - \s* = optional space before the target
 * - ((?:"[^"]*"|'[^']*'|BASH_WORD_CHAR)+) = one shell word: quoted spans and bare
 *   runs, joined as the shell joins them (`"$HOME"/.claude/…` is one word)
 */
const BASH_FILE_REDIRECT_PATTERN = new RegExp(
  String.raw`(?<![=\-<>])>{1,2}\|?(?!&[\d-])&?\s*((?:"[^"]*"|'[^']*'|${BASH_WORD_CHAR})+)`,
  'g',
);

/**
 * .what = every file a bash command redirects output into, quotes removed
 * .why = the memory guard grades a redirect by where it lands, so a read with `2>&1`
 *        or an arrow in a grep pattern is never mistaken for a write into memory
 */
export const getAllBashRedirectTargets = (input: {
  command: string;
}): string[] =>
  [...input.command.matchAll(BASH_FILE_REDIRECT_PATTERN)].flatMap((match) =>
    match[1] ? [match[1].replace(/["']/g, '')] : [],
  );
