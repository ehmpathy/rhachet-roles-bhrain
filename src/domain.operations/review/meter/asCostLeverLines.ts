/**
 * .what = the header the two-lever block carries at every breadth
 * .why = one concept, one string: every breadth reads this block by the same name,
 *        and a test that asserts the header imports this rather than restate it
 *        (rule.forbid.ambiguous-labels)
 */
export const HEADER_OF_COST_LEVERS = 'levers — input DOWN · cache UP';

/**
 * .what = the glyphs and label width each layout renders with
 * .why = the two layouts part on exactly these three facets of shape and naught
 *        else, so they are declared as data beside the one render that reads them
 *
 * .note = both layouts pad labels to one width, 11, the field the token block
 *         beside the levers holds at every breadth — `cache.set: ` in the run and
 *         tree token rows, `cache.set` plus its two-space gutter in the grove
 *         total. so a lever figure starts in the same column as the token values
 *         next to it, on every page
 */
const SHAPE_OF_LAYOUT: Record<
  'branch' | 'section',
  { header: string; rail: string; labelWidth: number }
> = {
  branch: { header: '├─ ', rail: '│  ', labelWidth: 11 },
  section: { header: '', rail: '   ', labelWidth: 11 },
};

/**
 * .what = the two cost levers, side by side, under one prefix — input size and cache rate
 * .why = review cost has exactly two levers and they multiply into the bill, so a
 *        surface that renders one argues for the wrong optimization: a fully cached
 *        prompt of 1M chars still bills 1M chars, and a small volatile prompt can
 *        cost more than a large stable one. all three breadths therefore render both,
 *        by default, from one skeleton — so a lever added or relabelled lands on every
 *        breadth at once, and no breadth can quietly omit one
 *        (rule.require.report-both-cost-levers-with-trend-and-locus,
 *        rule.forbid.duplicate-format-tree-operations).
 *
 * .note = each figure arrives rendered, exactly as `asTokenRowLines` takes them. the
 *         absent decision differs per breadth — a run may be `unknown`, a tree sums
 *         only metered runs — and that decision is the caller's; this owns the row
 *         shape alone.
 *
 * .note = `trend` is optional and renders as a second clause per lever rather than a
 *         separate block, so a reader sees the level and its direction on one line.
 *         a breadth with one data point passes it absent, never a fabricated zero.
 *
 * 🔴 .note = a trend renders its WINDOW in the header, always. an unlabelled trend
 *     reads as "over this whole corpus", and a corpus is rarely the window a trend
 *     is comparable over — this surface was first wired to read its endpoints
 *     across two stones, and rendered two red verdicts for a lever that had in
 *     fact improved (`getAllBucketsOfLatestStone`). so the window is required
 *     alongside the figures rather than optional beside them.
 */
export const asCostLeverLines = (input: {
  prefix: string;
  /**
   * where the block sits in its page's tree
   * - `branch` = a child of the section above it, as `--of run` and `--of tree`
   *   render it: the header takes a `├─` and the rows hang under a `│` rail
   * - `section` = a top-level section of its own, as `--of grove` renders it: the
   *   header stands bare, and the labels pad to the grove total's label field
   *
   * .why = one render with the layout as a parameter, never a second copy per
   *        breadth — the grove once hand-kept these rows, so a row change had two
   *        homes (rule.forbid.duplicate-format-tree-operations)
   */
  layout: 'branch' | 'section';
  figures: {
    /** input size, rendered — the lever to drive DOWN */
    input: string;
    /** cache hit rate, rendered — the lever to drive UP */
    cache: string;
  };
  trend?: {
    /**
     * what the trend is measured ACROSS, in the reader's words — e.g.
     * `6 rounds of 5.1.execution.from_vision`. required with a trend, since a
     * move with no window is a claim with no subject.
     */
    window: string;
    /** the input-size move, rendered with its arrow (e.g. `↓ 58%`) */
    input: string;
    /** the cache-rate move, rendered with its arrow (e.g. `↑ 31.0pp`) */
    cache: string;
  };
  /**
   * where a breadth holds no trend of its own, the breadth that does — rendered in
   * the header in place of a trend window
   *
   * .why = a breadth with one sample cannot carry a move, and silence there reads
   *        as "this report has no trend anywhere". the pointer names where the move
   *        lives, so the stat is reachable from every breadth even where it cannot
   *        be computed (rule.require.report-both-cost-levers-with-trend-and-locus)
   */
  trendElsewhere?: string;
  /**
   * a caveat per lever, rendered — e.g. why a cache rate reads zero
   *
   * .why = a caveat rides AFTER the move, never inside the figure. folded into the
   *        figure, a long caveat stood between a rate and its arrow, so `→ flat` read
   *        as a clause of the caveat rather than the direction of the rate
   */
  caveats?: { cache?: string };
  /**
   * a key that closes the block, rendered once as its last row — e.g. what a bare
   * absent mark on both levers means
   *
   * .why = a caveat shared by both levers belongs to the block, never to each row;
   *        repeated per row, it buries the figures it qualifies
   */
  footnote?: string | null;
  /**
   * the shared-prefix verdict rollup, rendered — one row under the cache lever
   *
   * .why = a cache rate alone reads alike whether the cache missed a prefix the
   *        prompts shared, or the prompts shared none. the rollup sits beside the
   *        rate it explains, so the tree and grove read it in the one place a reader
   *        weighs the cache lever (`asPrefixVerdictRollupHuman`)
   */
  verdicts?: string | null;
}): string[] => {
  const shape = SHAPE_OF_LAYOUT[input.layout];
  const title = input.trend
    ? `${HEADER_OF_COST_LEVERS} (trend over ${input.trend.window})`
    : input.trendElsewhere
      ? `${HEADER_OF_COST_LEVERS} (trend: ${input.trendElsewhere})`
      : HEADER_OF_COST_LEVERS;

  // a trend clause rides its own lever's line, so level and direction read together
  const asRow = (row: {
    branch: string;
    label: string;
    figure: string;
    move: string | null;
    caveat: string;
  }): string =>
    `${input.prefix}${shape.rail}${row.branch} ${row.label.padEnd(shape.labelWidth)}${row.figure}${row.move === null ? '' : `   ${row.move}`}${row.caveat}`;

  // the footnote, where present, takes the last branch, so the rows above stay open
  const footnote = input.footnote ?? null;
  const verdicts = input.verdicts ?? null;
  const isCacheLast = verdicts === null && footnote === null;
  return [
    `${input.prefix}${shape.header}${title}`,
    asRow({
      branch: '├─',
      label: 'input:',
      figure: input.figures.input,
      move: input.trend?.input ?? null,
      caveat: '',
    }),
    asRow({
      branch: isCacheLast ? '└─' : '├─',
      label: 'cache:',
      figure: input.figures.cache,
      move: input.trend?.cache ?? null,
      caveat: input.caveats?.cache ?? '',
    }),
    ...(verdicts === null
      ? []
      : [
          asRow({
            branch: footnote === null ? '└─' : '├─',
            label: 'prefix:',
            figure: verdicts,
            move: null,
            caveat: '',
          }),
        ]),
    ...(footnote === null
      ? []
      : [`${input.prefix}${shape.rail}└─ ${footnote}`]),
  ];
};
