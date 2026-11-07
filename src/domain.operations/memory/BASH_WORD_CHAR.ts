/**
 * .what = the regex char class for one bare char of a shell word
 * .why = the memory-path lift and the redirect-target parse must agree on where a
 *        word ends; one source, so the two patterns cannot drift apart
 *
 * a word ends at: whitespace · a quote · `;` `|` `&` · `<` `>` · `(` `)`
 */
export const BASH_WORD_CHAR = String.raw`[^\s"';|&<>()]`;
