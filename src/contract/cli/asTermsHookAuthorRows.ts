/**
 * .what = the child rows that name the authors of a set of term hook entries, each once
 * .why = the drift leaf and the also-removed leaf both name whose entries they count, so a
 *        human sees the same list before `enable` and after `disable`; an entry with no author
 *        reads in words, never as a marker
 */
export const asTermsHookAuthorRows = (input: {
  authors: string[];
}): string[] => {
  const authorsOnce = [...new Set(input.authors)];
  return authorsOnce.map((author, index) => {
    const glyph = index === authorsOnce.length - 1 ? '└─' : '├─';
    const words = author === '(no author)' ? 'with no author' : `by ${author}`;
    return `   │  ${glyph} ${words}`;
  });
};
