import { asMarkdownTables } from './asMarkdownTables';

/**
 * .what = the rows of the first table whose header holds every named column, each row keyed
 *         by its lowercased header; null when no table holds them all
 * .why = the plot, the course yields, and the pedigree read tables by column name, never by
 *        position, so a driver may add a column or reorder them freely
 */
export const asMarkdownTableRows = (input: {
  markdown: string;
  columns: string[];
}): Array<Record<string, string>> | null => {
  const table = asMarkdownTables({ markdown: input.markdown })
    .map((t) => ({
      header: t.header.map((cell) => cell.toLowerCase()),
      rows: t.rows,
    }))
    .find((t) => input.columns.every((col) => t.header.includes(col)));
  if (!table) return null;
  return table.rows.map((cells) =>
    Object.fromEntries(
      table.header.map((name, index) => [name, cells[index] ?? '']),
    ),
  );
};
