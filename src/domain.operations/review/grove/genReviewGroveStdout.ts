import type { IsoPriceWords } from 'iso-price';

import type { ReviewTokens } from '@src/domain.objects/Reviewer/ReviewTokens';
import { asCountHuman } from '@src/domain.operations/review/asCountHuman';
import { asPromptInputsCensusLines } from '@src/domain.operations/review/asPromptInputsCensusLines';
import { asRateHuman } from '@src/domain.operations/review/asRateHuman';
import type { GradeCensus } from '@src/domain.operations/review/getOneGradeCensus';
import { getOnePromptTokens } from '@src/domain.operations/review/getOnePromptTokens';
import type {
  GroveRollupRow,
  ReviewGroveReport,
} from '@src/domain.operations/review/grove/genReviewGroveReport';
import { getOneFullRateTokens } from '@src/domain.operations/review/grove/getOneFullRateTokens';
import {
  asCostColumnHuman,
  WIDTH_OF_COST_COLUMN,
} from '@src/domain.operations/review/meter/asCostColumnHuman';
import { asCostLeverLines } from '@src/domain.operations/review/meter/asCostLeverLines';
import { WORD_OF_ABSENT } from '@src/domain.operations/review/meter/asFigureHuman';
import { asPrefixVerdictRollupHuman } from '@src/domain.operations/review/meter/asPrefixVerdictRollupHuman';
import { getOneCostLeverFigures } from '@src/domain.operations/review/meter/getOneCostLeverFigures';
import { asCountedNoun } from '@src/utils/asCountedNoun';

/**
 * .what = renders a token count summed over a census, or `absent` when not one run
 *         in it was accounted
 * .why = a sum over zero accounted runs is `0`, and a `0` reads as "this sent no
 *        tokens" — the misread the grade exists to prevent. the tree breadth holds
 *        the same law (`asBucketTokensHuman`), so one corpus reads one way at every
 *        `--of`. a refused run counts as accounted: it sent none, as a fact
 */
const asTokenCount = (input: { of: number; census: GradeCensus }): string =>
  input.census.metered + input.census.refused === 0
    ? WORD_OF_ABSENT
    : asCountHuman({ of: input.of });

/**
 * .what = binds this surface's absent word onto the shared rate render
 * .why = the law of this whole meter: a rate with no denominator renders as
 *        ABSENT, never as `0.0%`. a zero says "we measured none"; absent says
 *        "we could not measure" — and only one of those is true here. that law
 *        and its format live once, in `asRateHuman`.
 *
 * .note = what stays local is the WORD alone. the grove prints `absent` where the
 *         tree surfaces print a dash; that divergence is declared as a pair in
 *         `asFigureHuman` and is deliberate. so this binder supplies the word once
 *         rather than at each call site, and holds no render of its own.
 */
const asShare = (input: { of: number | null }): string =>
  asRateHuman({ of: input.of, absent: WORD_OF_ABSENT });

/**
 * .what = renders a spend figure, or `absent` when no run could account for it
 * .why = the same law as `asShare`, on the axis that costs money to get wrong.
 *        a lane whose every run is `unknown` has spend nobody recorded — the brain
 *        may genuinely have been billed. to print `$0.00` there states a measurement
 *        nobody made as a fact, and it reads exactly like a lane that truly spent
 *        naught (rule.forbid.failhide).
 *
 * .note = a `refused` lane is the OPPOSITE case and must still render `$0` — a
 *         refusal never reached the brain, so its nil is a fact. that distinction
 *         is drawn upstream in `getOneAccountedCost`; this renderer honors the null.
 *
 * .note = rendered through `asCostColumnHuman`, the one precision the tree meter's
 *         column uses too — so a metered row and a refused row beneath it align,
 *         and one figure reads alike at `--of tree` and `--of grove`
 */
const asSpend = (input: { of: IsoPriceWords | null }): string =>
  input.of === null ? WORD_OF_ABSENT : asCostColumnHuman({ cost: input.of });

/**
 * .what = renders the honesty census inline — `3 metered · 0 refused · 2 unknown`
 * .why = every aggregate is read against the share of the corpus that proved it.
 *        the words match the tree's own (`asGradesWord`); the grove carries no glyph
 *        beside the unknown count, since the cost row below already states what an
 *        unknown run means for the total, once
 */
const asCensusLine = (input: { census: GradeCensus }): string =>
  `${input.census.metered} metered · ${input.census.refused} refused · ${input.census.unknown} unknown`;

/**
 * .what = the terse unknown mark a rollup row carries — `  +3 unknown`
 * .why = a row that dropped N unknown runs reads cheap; the mark keeps a driver from
 *        a prune of a lane whose cost is merely unrecorded. the full sense
 *        (unrecorded, never zero) is stated once, beside the grove total cost
 */
const asUnknownMark = (input: { unknown: number }): string =>
  input.unknown === 0 ? '' : `  +${input.unknown} unknown`;

/**
 * .what = the note the grove total cost carries — the unknown runs it dropped
 * .why = a sum that dropped N unknown runs is a floor. the gap is named here, once,
 *        so the total never reads complete when it is not (rule.forbid.failhide);
 *        where no gap exists, the note is empty and costs no glyph
 */
const asTotalCostNote = (input: { unknown: number }): string =>
  input.unknown > 0 ? `(+${input.unknown} unknown, unrecorded)` : '';

/**
 * .what = renders the grove total — the four disjoint token axes, then the cost
 * .why = the split IS the answer — cache.get is 31.4x cheaper than input, so a
 *        lone total says naught about where the money went. labels and values sit
 *        in two aligned columns, so the block reads at a glance
 *
 * .note = cache.set reads `at full rate, once per seed` — the price
 *         `ReviewTokens.cacheSet` declares, and the one `getOneFullRateTokens` sums
 *         (rule.require.single-source-of-truth-for-render). `output` is the one axis
 *         that is NOT read, so its note states the exclusion rather than fakes a share
 */
const asGroveTotalLines = (input: {
  report: ReviewGroveReport;
  indent: string;
}): string[] => {
  const { report } = input;
  const tokens: ReviewTokens = report.tokens;
  const read = getOnePromptTokens({ tokens });
  const shareOf = (n: number): string =>
    asShare({ of: read === 0 ? null : n / read });
  const countOf = (n: number): string =>
    asTokenCount({ of: n, census: report.census });
  const rows = [
    {
      label: 'input',
      value: countOf(tokens.input),
      note: `(${shareOf(tokens.input)} of read, at full rate)`,
    },
    {
      label: 'cache.set',
      value: countOf(tokens.cacheSet),
      note: `(${shareOf(tokens.cacheSet)} of read, at full rate, once per seed)`,
    },
    {
      label: 'cache.get',
      value: countOf(tokens.cacheGet),
      note: `(${shareOf(tokens.cacheGet)} of read, 31.4x cheaper)`,
    },
    {
      label: 'output',
      value: countOf(tokens.output),
      note: '(not of read, at output rate)',
    },
    {
      label: 'cost',
      value: asSpend({ of: report.cost }).trim(),
      note: asTotalCostNote({ unknown: report.census.unknown }),
    },
  ];
  const widthOfLabel = Math.max(...rows.map((row) => row.label.length));
  const widthOfValue = Math.max(...rows.map((row) => row.value.length));
  return rows.map((row, index) =>
    `${input.indent}${index === rows.length - 1 ? '└─' : '├─'} ${row.label.padEnd(widthOfLabel)}  ${row.value.padStart(widthOfValue)}  ${row.note}`.trimEnd(),
  );
};

/**
 * .what = the two cost levers for the whole grove — input size per run, and cache rate
 * .why = this breadth carried a `cache:` row and no comparable input figure: four raw
 *        token counts are the arithmetic, never the lever, since a total rises with
 *        the run count alone. so a grove reader could act on one lever and had to do
 *        a division by hand to act on the other — and the hand-written rollup is the
 *        tell that the tool owes it
 *        (rule.require.report-both-cost-levers-with-trend-and-locus).
 *
 * 🔴 .note = the trend is taken over `byDay`, never over the rollups. the rollups are
 *     keyed by tree, route, stone, and slug — places, not times — so a move computed
 *     across them would report the gap between two worktrees, which is no change at
 *     all. the day each run was minted is the one time axis every tree shares. the
 *     window is named in the header, so the move reads as a claim over N days.
 *
 * .note = `report.rateOfCacheHit` is honored as it arrives, null and all — the grove
 *         has no cold/warm grade to fold in, since `getOneCacheGrade` is a per-bucket
 *         derivation over lane ordinals and a grove-wide zero spans every lane at once.
 */
const asGroveLeverLines = (input: { report: ReviewGroveReport }): string[] => {
  const { report } = input;
  const levers = getOneCostLeverFigures({
    corpus: {
      // metered runs alone bought a token, so they alone divide the figure —
      // the same divisor `asTokenCount` grades these counts against
      metered: report.census.metered,
      tokens: report.tokens,
      cacheHitRate: report.rateOfCacheHit,
    },
    series: report.byDay,
    // with no metered run there is no divisor, so the input figure is absent. it
    // reads as the WORD this page uses for every absence, never the meter
    // breadths' MARK `—` (rule.forbid.ambiguous-labels)
    absent: WORD_OF_ABSENT,
  });

  // .note = the rows render through the one lever render all three breadths share,
  //         in its `section` layout; the grove differs only in that layout and in
  //         its absent WORD, and both are parameters, never a second copy of the
  //         rows (rule.forbid.duplicate-format-tree-operations).
  // .note = the block ends on its last row: the caller separates every section
  //         with one blank line, so a blank here would double it
  return asCostLeverLines({
    layout: 'section',
    prefix: '   ',
    figures: {
      input: levers.figures.input,
      // the label and its tail match the `--of run` and `--of tree` rows word for
      // word, so one figure reads one way at every breadth
      // (rule.forbid.friction-hazards). the figure comes from `asShare`, which
      // renders a null rate as the WORD `absent` this page uses throughout
      // (rule.forbid.ambiguous-labels)
      cache: `${asShare({ of: report.rateOfCacheHit })} of prompt tokens served from cache`,
    },
    // the same verdict counts the `--of tree` row carries, in this page's absent WORD
    verdicts: asPrefixVerdictRollupHuman({
      rollup: report.prefix.verdicts,
      absent: WORD_OF_ABSENT,
    }),
    trend: levers.trend
      ? {
          ...levers.trend,
          window: asCountedNoun({
            count: report.byDay.length,
            one: 'day',
            many: 'days',
          }),
        }
      : undefined,
  });
};

/**
 * .what = renders one rollup axis as a ranked list
 * .why = the question is never "what did the grove spend" but "which lane is dear",
 *        so every axis is sorted by full-rate mass, richest first
 */
const asRollupLines = (input: {
  title: string;
  rows: GroveRollupRow[];
  limit: number;
}): string[] => {
  // an empty axis renders naught here; the caller names every empty axis on one line
  if (input.rows.length === 0) return [];

  const shown = input.rows.slice(0, input.limit);
  const overflows = input.rows.length > input.limit;

  // the rows past the limit still carry their unknown runs. a lane heavy in
  // unknown runs ranks low (only metered runs carry tokens), so it is exactly the
  // row the limit cuts — and the overflow line must not hide that its cost is
  // unrecorded, or a driver prunes a lane that only reads cheap
  const unknownHidden = input.rows
    .slice(input.limit)
    .reduce((sum, row) => sum + row.census.unknown, 0);
  return [
    `   ${input.title}`,
    ...shown.map((row, index) => {
      // `└─` is a LEAF marker, so it must be the last line of the branch. when an
      // overflow disclosure follows, the last SHOWN row is no longer last — the
      // disclosure is — so the row takes `├─` and the disclosure carries the `└─`.
      // rendered the other way, the disclosure read as content hung off a closed
      // branch (rule.require.treestruct-output, rule.forbid.snapshot-visual-blemishes)
      const last = index === shown.length - 1 && !overflows;
      const fullRate = getOneFullRateTokens({ tokens: row.tokens });
      // the full-rate mass leads because it is the sort key — the very operation
      // the rollup sorts on. to lead with cost while the sort runs on tokens
      // reads as a mis-sort (rule.forbid.surprises)
      //
      // and the column reads `at full rate`, never `billable`. cache.get IS
      // billed, at 1/31.4 — so `400,000 billable` beside 100,000 cached tokens
      // told a reader a figure no one measured, and contradicted the token block
      // above, which already renders `at full rate` and `31.4x cheaper` as the two
      // sides of this very split (rule.forbid.ambiguous-labels)
      //
      // `1 runs` reads as a render defect and makes a reader doubt the count
      // beside it, so the noun agrees. `align` pads it to the plural's width, so
      // the columns stay flush down the block (rule.require.treestruct-output),
      // and the agreement decision lives once (rule.prefer.wet-over-dry)
      const runs = asCountedNoun(
        { count: row.runs, one: 'run', many: 'runs' },
        { align: true },
      );
      return `      ${last ? '└─' : '├─'} ${asTokenCount({ of: fullRate, census: row.census }).padStart(11)} at full rate  ${asSpend({ of: row.cost }).padStart(WIDTH_OF_COST_COLUMN)}  ${runs.padStart(9)}  ${row.key}${asUnknownMark({ unknown: row.census.unknown })}`;
    }),
    // the overflow names its lever, so a reader warned of a hidden unknown run knows
    // how to see it (rule.require.errors-name-the-fix)
    ...(overflows
      ? [
          `      └─ … and ${input.rows.length - input.limit} more — raise --limit to list them${asUnknownMark({ unknown: unknownHidden })}`,
        ]
      : []),
    '',
  ];
};

/**
 * .what = the lines that name each tree whose log root could not be read
 * .why = such a tree enters no sum, so every figure below understates the grove
 *        by an amount nobody measured. the reader must see WHICH trees, and why,
 *        beside the count they would otherwise trust (rule.forbid.failhide).
 *        where every tree read cleanly, it renders naught — a no-op costs no line
 */
const asUnreadableTreeLines = (input: {
  unreadable: ReviewGroveReport['treesUnreadable'];
}): string[] => {
  if (input.unreadable.length === 0) return [];
  return [
    `   💥 MalfunctionError: ${asCountedNoun({ count: input.unreadable.length, one: 'tree', many: 'trees' })} unreadable — excluded from every figure below:`,
    ...input.unreadable.map(
      (one, index) =>
        `      ${index === input.unreadable.length - 1 ? '└─' : '├─'} ${one.tree}: ${one.fault}`,
    ),
  ];
};

/**
 * .what = renders the grove report as a tree a human reads at a glance
 * .why = the one place the grove mine becomes legible; the CLI holds only
 *        console.log and process.exit
 *
 * .note = every TOKEN figure is built from metered runs alone; a COST figure is built
 *         from the accounted runs — metered plus refused. a refused run proves nil
 *         cost, so it reads $0; an unknown run's cost is unrecorded, so it reads
 *         absent, never zero. the `runs:` line states the split, and the total cost
 *         row names the unknown count once — no static legend is owed in stdout
 */
export const genReviewGroveStdout = (input: {
  report: ReviewGroveReport;
  limit: number;
}): string => {
  const { report } = input;
  const treesSeen = report.trees.length;

  // the five rollup axes, each ranked by full-rate mass, richest first
  const axes = [
    { name: 'tree', rows: report.byTree },
    { name: 'route', rows: report.byRoute },
    { name: 'stone', rows: report.byStone },
    { name: 'reviewer', rows: report.byReviewer },
    { name: 'provider', rows: report.byProvider },
  ];
  const axesEmpty = axes.filter((axis) => axis.rows.length === 0);

  return (
    [
      "🦉 review cost — the grove: where this machine's review tokens went",
      '',
      `   root: ${report.root}`,
      `   trees: ${treesSeen} walked · ${report.treesWithLogs} carried review logs · ${treesSeen - report.treesWithLogs} never reviewed`,
      ...asUnreadableTreeLines({ unreadable: report.treesUnreadable }),
      `   runs:  ${report.runsFound} found — ${asCensusLine({ census: report.census })}`,
      '',
      '   the grove total',
      // `cost` is the leaf of the total block, and it carries the one statement of
      // what an unknown run means for the sum. the cache rate sits in
      // the lever block below, beside its peer lever
      // (rule.require.report-both-cost-levers-with-trend-and-locus)
      ...asGroveTotalLines({ report, indent: '      ' }),
      '',
      ...asGroveLeverLines({ report }),
      '',
      ...asPromptInputsCensusLines({
        inputs: report.inputs,
        header: '   by input',
        gutter: '      ',
        absent: WORD_OF_ABSENT,
      }),
      '',
      ...axes.flatMap((axis) =>
        asRollupLines({
          title: `by ${axis.name}`,
          rows: axis.rows,
          limit: input.limit,
        }),
      ),
      // every empty axis is named on ONE line, so absence stays visible at the cost
      // of one row rather than two per axis
      ...(axesEmpty.length > 0
        ? [
            `   by ${axesEmpty.map((axis) => axis.name).join(' · ')}: absent — no run carried ${axesEmpty.length === 1 ? 'it' : 'them'}`,
          ]
        : []),
    ]
      .join('\n')
      // each rollup axis closes with a blank spacer row; the last one has no peer to
      // part it from, so the render ends on its last row, as the tree breadths do
      .trimEnd()
  );
};
