/**
 * .what = one markdown table: its header cells and its body rows
 */
interface MarkdownTable {
  header: string[];
  rows: string[][];
}

/**
 * .what = split one `| a | b |` line into its trimmed cells
 * .note = an escaped pipe (`\|`) stays inside its cell and reads back as `|`, as gfm allows
 */
const asCells = (input: { line: string }): string[] =>
  input.line
    .trim()
    .replace(/^\|/, '')
    .replace(/(?<!\\)\|$/, '')
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim().replace(/\\\|/g, '|'));

/**
 * .what = whether a line is a table's `|---|---|` divider
 * .note = one dash per cell suffices (`|-|`, `|:-:|`), as gfm allows; a divider that
 *         demands three would refuse a table a driver plainly wrote
 */
const isDivider = (input: { line: string }): boolean =>
  /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?$/.test(input.line.trim());

/**
 * .what = every pipe table in a markdown text, in document order
 * .why = each course yield carries fixed tables (outcome, greats, claims, yields) that the
 *        pedigree reads; one parser serves them all
 */
export const asMarkdownTables = (input: {
  markdown: string;
}): MarkdownTable[] => {
  const lines = input.markdown.split('\n');
  return lines.flatMap((line, index) => {
    // a table opens at a pipe line whose next line is a divider
    const next = lines[index + 1];
    if (
      !line.trim().startsWith('|') ||
      next === undefined ||
      !isDivider({ line: next })
    )
      return [];

    // its body runs until the first line that is no pipe line
    const bodyStart = index + 2;
    const bodyEnd = lines.findIndex(
      (l, i) => i >= bodyStart && !l.trim().startsWith('|'),
    );
    const body = lines.slice(
      bodyStart,
      bodyEnd === -1 ? lines.length : bodyEnd,
    );
    return [
      {
        header: asCells({ line }),
        rows: body.map((l) => asCells({ line: l })),
      },
    ];
  });
};
