import { asRateHuman } from '@src/domain.operations/review/asRateHuman';
import { getOneLocusChars } from '@src/domain.operations/review/meter/getOneLocusChars';
import { getOneTargetLocusRollup } from '@src/domain.operations/review/meter/getOneTargetLocusRollup';
import { asCountedNoun } from '@src/utils/asCountedNoun';

/**
 * .what = how many directory rows a locus renders before the tail names the rest
 * .why = it bounds the RENDER, never the scan — every directory is summed, and the
 *        rows past it are reported as a named remainder (`F2`). ten fit a terminal
 */
export const LIMIT_OF_LOCUS_ROWS = 10;

/**
 * .what = the head every locus block opens with, at every breadth and in every state
 * .why = `locus` is the glossary term, and a reader who meets it cold cannot decode it.
 *        the head says what the block IS — where the target mass sits, by directory —
 *        so the table reads without the glossary (rule.require.discoverability)
 */
export const LABEL_OF_LOCUS = 'target mass by directory';

/**
 * .what = renders a measured locus — the head line, one row per directory, and a
 *         named remainder
 * .why = the run, tree, and grove breadths each owe the locus, and ONE render draws
 *        it for all three, so a directory reads the same at every breadth and a new
 *        column lands at all or none (rule.forbid.duplicate-format-tree-operations ·
 *        rule.require.report-both-cost-levers-with-trend-and-locus).
 *
 * .note = the caller draws the two degenerate states — UNREAD and an empty locus —
 *         since each breadth words them for its own corpus. this renders the answer.
 *
 * .note = the share is of the TARGET mass, never of the whole prompt, so the rows
 *         sum against the `targetFiles` + `targetDiffs` rows rather than refuse to
 *
 * .note = `figure` and `absent` are the caller's, never this render's — a shared
 *         render that hardcodes one breadth's scale or absent form leaks it onto
 *         every other breadth that draws through it
 *
 * .note = `suffix` rides on the head line, where a fold names its coverage — "from
 *         3 of 4 read runs" — so a reader weighs the rows against the runs that
 *         could supply them
 */
export const asTargetLocusLines = (input: {
  /** one entry per target path, with the chars it contributed */
  targets: { path: string; chars: number }[];
  /** how many directory rows to render before the remainder */
  limit: number;
  /** the head prefix, up to and with its branch glyph — e.g. `   ├─ ` */
  head: string;
  /** the gutter each child row sits in — e.g. `   │  ` */
  gutter: string;
  /** what rides at the end of the head line; `''` for none */
  suffix: string;
  /**
   * how a figure renders on this surface — `asFigureHuman` (scaled) on the run and the
   * refusal, `asCountHuman` (full separators) inside the census block the tree and the
   * grove share, so the locus reads at the same scale as the rows above it
   */
  figure: (input: { of: number }) => string;
  /** how an absent share reads on this surface — the breadth's own form */
  absent: string;
  /** what rides after a row's directory — e.g. its split by kind; null for none */
  detail: ((input: { dir: string }) => string) | null;
}): string[] => {
  const rollup = getOneTargetLocusRollup({ targets: input.targets });
  const shown = rollup.rows.slice(0, input.limit);
  const rest = rollup.rows.length - shown.length;

  // one line per shown directory, before any detail rides on it
  const lines = shown.map((row, index) => {
    const leaf = index === shown.length - 1 && rest === 0 ? '└─' : '├─';
    const share = asRateHuman({ of: row.share, absent: input.absent });
    return `${input.gutter}${leaf} ${share.padStart(6)}  ${input.figure({ of: row.chars }).padStart(8)} chars  ${asCountedNoun({ count: row.files, one: 'file', many: 'files' }).padEnd(9)} ${row.dir}`;
  });

  // the detail starts at one offset on every row, so the splits read as a column
  const widthOfLines = Math.max(0, ...lines.map((line) => line.length));
  const { detail } = input;
  const linesDetailed = detail
    ? lines.map(
        (line, index) =>
          `${line.padEnd(widthOfLines)}  ${detail({ dir: shown[index]!.dir })}`,
      )
    : lines;

  // the remainder is NAMED rather than dropped — a truncated rollup whose tail is
  // silent reads as a complete census of a smaller corpus
  const tail =
    rest > 0
      ? [
          `${input.gutter}└─ … ${asCountedNoun({ count: rest, one: 'more directory', many: 'more directories' })}, ${input.figure({ of: getOneLocusChars({ rows: rollup.rows.slice(shown.length) }) })} chars`,
        ]
      : [];

  return [
    `${input.head}${LABEL_OF_LOCUS} — ${input.figure({ of: rollup.chars })} chars over ${asCountedNoun({ count: rollup.rows.length, one: 'directory', many: 'directories' })}${input.suffix}`,
    ...linesDetailed,
    ...tail,
  ];
};
