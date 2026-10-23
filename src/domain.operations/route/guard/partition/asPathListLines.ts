/**
 * .what = how many paths a coverage list shows before it names the remainder
 * .why = a coverage read over a large branch listed every path — 1,395 lines on one stone —
 *        which no driver scans. five shows the shape of a list; the count carries its size
 */
export const CAP_OF_PATHS_LISTED = 5;

/**
 * .what = how many unclaimed paths a coverage list shows before it names the remainder
 * .why = an unclaimed path is the actionable gap, so it is listed whole unless the list is
 *        long enough to bury the verdict beneath it
 */
export const CAP_OF_PATHS_UNCLAIMED = 20;

/**
 * .what = a treestruct list of rows, capped to a head, with the remainder NAMED
 * .why = one render for every per-file list of the coverage tree, so each caps alike
 *        (rule.forbid.duplicate-format-tree-operations). the remainder is named rather than
 *        dropped — a truncated list whose tail is silent reads as a complete one
 *
 * .note = `limit: null` lists every row (the `--full` read)
 */
export const asPathListLines = (input: {
  /** the rows, already rendered — a path, or a path with its annotation */
  rows: string[];
  /** how many rows to show; null for every row */
  limit: number | null;
  /** the prefix each branch sits at */
  gutter: string;
  /** whether the list's last line closes its parent branch */
  closes: boolean;
}): string[] => {
  // the head of the list, and how many rows it leaves out
  const shown =
    input.limit === null ? input.rows : input.rows.slice(0, input.limit);
  const hidden = input.rows.length - shown.length;
  const texts = [
    ...shown,
    ...(hidden > 0 ? [`… +${hidden} more (--full lists every path)`] : []),
  ];

  // each row on its branch; the last closes only when the list ends its parent
  return texts.map(
    (text, index) =>
      `${input.gutter}${index === texts.length - 1 && input.closes ? '└─' : '├─'} ${text}`,
  );
};
