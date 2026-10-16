import { asPromptInputsCensusLines } from '@src/domain.operations/review/asPromptInputsCensusLines';
import { asRateHuman } from '@src/domain.operations/review/asRateHuman';
import { getOnePromptTokens } from '@src/domain.operations/review/getOnePromptTokens';
import { MINUTES_OF_CACHE_REACH } from '@src/domain.operations/review/MINUTES_OF_CACHE_REACH';
import {
  asCostColumnHuman,
  WIDTH_OF_COST_COLUMN,
} from '@src/domain.operations/review/meter/asCostColumnHuman';
import { asCostLeverLines } from '@src/domain.operations/review/meter/asCostLeverLines';
import {
  asFigureHuman,
  MARK_OF_ABSENT,
} from '@src/domain.operations/review/meter/asFigureHuman';
import { asGradesWord } from '@src/domain.operations/review/meter/asGradesWord';
import { asPrefixVerdictRollupHuman } from '@src/domain.operations/review/meter/asPrefixVerdictRollupHuman';
import { asTokenRowLines } from '@src/domain.operations/review/meter/asTokenRowLines';
import { asUnknownCaveat } from '@src/domain.operations/review/meter/asUnknownCaveat';
import type {
  ReviewMeterBucket,
  ReviewMeterReport,
} from '@src/domain.operations/review/meter/genReviewMeterReport';
import { getAllBucketsOfLatestStone } from '@src/domain.operations/review/meter/getAllBucketsOfLatestStone';
import {
  type CostLeverSample,
  getOneCostLeverFigures,
} from '@src/domain.operations/review/meter/getOneCostLeverFigures';
import type { ReviewPrefixRollup } from '@src/domain.operations/review/meter/ReviewPrefixPair';
import { SLUG_OF_ABSENT_IDENTITY } from '@src/domain.operations/review/SLUG_OF_ABSENT_IDENTITY';
import { asCountedNoun } from '@src/utils/asCountedNoun';

/**
 * .what = binds this surface's absent glyph onto the shared rate render
 * .why = a rate over a zero denominator is undefined, never 0% — the two must not
 *        render alike, or a corpus that measured naught reads as a corpus that
 *        cached naught. that law and its format live once, in `asRateHuman`.
 *
 * .note = what stays local is the glyph alone. the tree surfaces print a dash and
 *         the grove prints the word; that divergence is declared as a pair in
 *         `asFigureHuman` and is deliberate. so this binder supplies the mark once
 *         rather than at each call site, and holds no render of its own.
 */
const asCacheRateHuman = (input: { rate: number | null }): string =>
  asRateHuman({ of: input.rate, absent: MARK_OF_ABSENT });

/**
 * .what = renders a token count measured over a bucket, or the absent mark when not
 *         one run in that bucket is accounted
 * .why = the same law as the rate and the spend, and the easiest half to miss. a
 *        sum over zero metered runs is `0`, and a `0` here reads as "this lane
 *        sent no tokens" — the precise misread the grade exists to prevent. a
 *        bucket that holds a refused run does render 0, since a refusal sent
 *        none, as a fact
 */
const asBucketTokensHuman = (input: {
  bucket: ReviewMeterBucket;
  tokens: number;
}): string =>
  input.bucket.runs.accounted === 0
    ? MARK_OF_ABSENT
    : asFigureHuman({ of: input.tokens });

/**
 * .what = renders a bucket's spend, or the absent mark when no run was accounted
 * .why = same law as the rate: unmeasured spend is absent, not free
 */
const asCostHuman = (input: { bucket: ReviewMeterBucket }): string =>
  input.bucket.cost === null
    ? MARK_OF_ABSENT
    : asCostColumnHuman({ cost: input.bucket.cost });

/**
 * .what = the caveat that parts a cold zero from a lost or defective one
 * .why = `0.0% cached` read identically for a lane on its first run — which
 *        cannot hit a cache that does not exist — a lane whose prefix aged past
 *        the cache reach, and a lane on its sixth, which had one and missed. the
 *        first is a fact about the world; the second is a loss a shorter pause
 *        prevents; the third is the defect this whole branch exists to find, and
 *        the meter stated all three as one figure (rule.forbid.failhide ·
 *        `getOneCacheGrade`).
 *
 * .note = rides at the row's tail, beside `asUnknownCaveat`, rather than
 *         inside the `cached` column. a marker in the column would widen it
 *         by a variable amount and shift `cost` out of alignment on the rows
 *         that carry one — and a treestruct's columns must line up
 *         (rule.require.treestruct-output).
 */
const asCacheCaveat = (input: { bucket: ReviewMeterBucket }): string => {
  const { bucket } = input;
  // a null rate already renders absent; a non-zero one needs no excuse
  if (bucket.cacheHitRate === null || bucket.cacheHitRate > 0) return '';

  // a cold zero names its cause, since the two causes want opposite acts: a first
  // round is the weather and owes none; a lapsed prefix is a real loss that only a
  // shorter pause between rounds prevents (`getOneCacheGrade`)
  const grade = bucket.cacheGrade;
  if (grade?.kind === 'cold' && grade.cause === 'first')
    return '  cold (first round) — no prior prompt of its lane to share a prefix with';
  if (grade?.kind === 'cold' && grade.cause === 'lapsed')
    return `  🟡 cold (lapsed ${Math.round(grade.minutes)}m) — its prefix aged past the ${MINUTES_OF_CACHE_REACH}-minute cache reach between rounds`;
  // the zero no pause explains: the prefix broke between rounds, so the next move is to
  // find which input sits past the cache seam — the run breadth names it, and its own
  // zero-rate caveat points back here (`--of tree --trace`), so each leads to the other.
  // the hint names `--at`: a bare `--of run` reads the LATEST run, never the row flagged
  return '  🟡 warm and cached NAUGHT — a prefix broke; `--of run --at <rundir>` names the input past the seam';
};

/**
 * .what = renders one rollup row
 * .why = one row shape for all three axes, so they stay scannable side by side
 */
const asBucketRow = (input: {
  bucket: ReviewMeterBucket;
  keyWidth: number;
}): string => {
  const { bucket } = input;
  const key = bucket.key.padEnd(input.keyWidth);
  // the noun agrees, so a single-run lane does not read as `1 runs` — the
  // decision lives once, in `asCountedNoun`, rather than a third time here
  // (rule.prefer.wet-over-dry). `align` pads `run` to the plural's width,
  // which keeps this column flush
  const runs = asCountedNoun(
    { count: bucket.runs.total, one: 'run', many: 'runs' },
    { align: true, padCount: 3 },
  );
  const promptTokens = getOnePromptTokens({ tokens: bucket.tokens });
  // labeled `prompt`, never `in` — `in` reads as a direction, and the figure
  // is a count of prompt tokens (input + cache.set + cache.get), never of inputs
  const tokens = `${asBucketTokensHuman({ bucket, tokens: promptTokens }).padStart(7)} prompt`;
  const cache = `${asCacheRateHuman({ rate: bucket.cacheHitRate }).padStart(6)} cached`;
  const cost = asCostHuman({ bucket }).padStart(WIDTH_OF_COST_COLUMN);
  return `${key}  ${runs} · ${tokens} · ${cache} · ${cost}${asUnknownCaveat({ unknown: bucket.runs.unknown })}${asCacheCaveat({ bucket })}`;
};

/**
 * .what = the width of the key column — the longest bucket key, and at least one
 * .why = keys align in one column; the floor of one keeps an empty axis from a zero pad
 */
const getOneKeyWidth = (input: { buckets: ReviewMeterBucket[] }): number =>
  Math.max(...input.buckets.map((bucket) => bucket.key.length), 1);

/**
 * .what = renders one axis of the report as a tree section
 * .why = the three axes differ only by title and rows
 */
const asAxisSection = (input: {
  title: string;
  buckets: ReviewMeterBucket[];
  last: boolean;
  /** how the rows are ordered — `rank` sorts heaviest prompt first, `key` in axis order */
  sort: 'rank' | 'key';
}): string[] => {
  const stem = input.last ? ' ' : '│';
  const keyWidth = getOneKeyWidth({ buckets: input.buckets });
  const rows = input.buckets.map((bucket, index) => {
    const leaf = index === input.buckets.length - 1 ? '└─' : '├─';
    return `   ${stem}  ${leaf} ${asBucketRow({ bucket, keyWidth })}`;
  });
  return [
    `   ${input.last ? '└─' : '├─'} by ${input.title}${HINT_OF_AXIS_SORT[input.sort]}`,
    ...rows,
  ];
};

/**
 * .what = the clause each axis header carries to name the figure its rows rank by
 * .why = `--of tree` ranks on prompt tokens and `--of grove` on full-rate tokens, by
 *        design (F8), so one lane can lead one page and trail the other. each header
 *        names its own figure, so the shift between the two reads as two rankings
 *        rather than a mis-sort (rule.forbid.surprises)
 */
const HINT_OF_AXIS_SORT: Record<'rank' | 'key', string> = {
  rank: ' — heaviest prompt first',
  key: '',
};

/**
 * .what = the three fields of a bucket the two cost levers are computed over
 * .why = one named projection for the corpus and every round of the series, so the
 *        renderer reads the two levers as named acts rather than an inline lambda
 */
const asLeverSampleOfBucket = (bucket: ReviewMeterBucket): CostLeverSample => ({
  metered: bucket.runs.metered,
  tokens: bucket.tokens,
  cacheHitRate: bucket.cacheHitRate,
});

/**
 * .what = the round buckets that sit on a round, without the absent-identity bucket
 * .why = a hand `rhx review` run carries no round, so it sits in `SLUG_OF_ABSENT_IDENTITY`;
 *        that key opens with `(`, which sorts first, so a trend that kept it would read a hand
 *        run as round one
 */
const getAllBucketsOnRoundAxis = (input: {
  buckets: ReviewMeterBucket[];
}): ReviewMeterBucket[] =>
  input.buckets.filter((bucket) => bucket.key !== SLUG_OF_ABSENT_IDENTITY);

/**
 * .what = renders the review meter report for a human
 * .why = the meter's human surface. reports per reviewer, per round, and per stone —
 *        never one grove total, because a total hides which lane is dear
 */
export const genReviewMeterStdout = (input: {
  report: ReviewMeterReport;
  root: string;
  /**
   * whether to render the `round × reviewer` cross-tab beneath the marginals.
   *
   * .why = it is the axis that can show a lever moved — and it is also the
   *        only one whose row count is the product of two others. a tree
   *        with 9 lanes over 6 rounds renders ~54 rows, which would bury the
   *        three marginals a reader opened the report for
   *        (`rule.prefer.defaults-match-common-case`).
   *
   * .note = opt-in is a best guess at a flag the wisher owns — itemized as a
   *         fulcrum, and a clean rework either way: the axis is already
   *         computed, so to make it default is the deletion of this option.
   */
  trace?: boolean;
  /**
   * the shared-prefix verdict counts over every round pair of this tree
   * (`getOnePrefixCensusOfRuns`)
   *
   * .note = absent (`undefined`) where the caller did not pair rounds at all, so no
   *         prefix row renders; the cli always pairs, and so always renders it
   */
  prefix?: ReviewPrefixRollup;
}): string => {
  const { corpus } = input.report;

  // the phrase is built by one operation every tree surface reads, so a grade
  // cannot read as two words across the tree breadths. the grove keeps its own
  // declared peer, `asCensusLine`, which omits the 🟡 on purpose (`F9`;
  // `term=review.grade`)
  const grades = asGradesWord({ census: corpus.runs });

  /**
   * the two levers, and their round-over-round move.
   *
   * 🔴 the `SLUG_OF_ABSENT_IDENTITY` row is dropped from the SERIES, never from
   * the corpus. its key opens with `(`, which sorts ahead of every digit in
   * ASCII, so a key-sorted `byRound` puts every hand `rhx review` run FIRST —
   * and a trend that read `measured[0]` would report a hand run as round one and
   * compute its whole margin against a bucket that sits on no round at all.
   *
   * .note = the corpus figure keeps those runs, since they are real spend
   *         (`SLUG_OF_ABSENT_IDENTITY`, rule.forbid.failhide). only the trend
   *         needs a time axis, and they sit on none.
   */
  // 🔴 the series holds the STONE fixed. `byRound` spans every stone, and its
  // key order runs from the earliest stone's first round to the latest stone's
  // last — so its endpoints compare a vision corpus against a source corpus
  // (`getAllBucketsOfLatestStone`, which records what that misread rendered)
  const window = getAllBucketsOfLatestStone({
    buckets: getAllBucketsOnRoundAxis({ buckets: input.report.byRound }),
  });
  const levers = getOneCostLeverFigures({
    corpus: asLeverSampleOfBucket(corpus),
    series: window.buckets.map(asLeverSampleOfBucket),
    absent: MARK_OF_ABSENT,
  });

  const lines = [
    // the header names the command and the breadth, exactly as its two
    // peers do (`— one run`, `— the grove`). it read `🦉 review meter` — the
    // name of a command that no longer exists, so a human who typed
    // `review._.cost --of tree` was answered by a deleted one. a stdout line
    // is a published surface, never a comment, so a retired name in it is
    // the defect `F5` depth 3 already caught once
    '🦉 review cost — this tree',
    `   ├─ corpus: ${input.root}`,
    `   │  ├─ runs: ${corpus.runs.total} (${grades})`,
    // the levers lead, because they are the two figures every other line here
    // exists to explain. they render by default at all three breadths from one
    // skeleton (rule.require.report-both-cost-levers-with-trend-and-locus)
    ...asCostLeverLines({
      layout: 'branch',
      prefix: '   │  ',
      figures: {
        input: levers.figures.input,
        cache: `${levers.figures.cache} of prompt tokens served from cache`,
      },
      // the cold/warm grade rides the row it qualifies, never a line of its own: a
      // `0.0%` on a cold bucket is a fact about the world and the same figure on a
      // warm one is a defect, so the two must never be read apart (`getOneCacheGrade`).
      // it trails the trend, so the arrow stays beside the rate it moves
      caveats: { cache: asCacheCaveat({ bucket: corpus }) },
      // the verdict counts sit under the rate they explain — a zero rate reads
      // as a miss, a layout break, or a self-cache only once they are counted
      verdicts:
        input.prefix === undefined
          ? null
          : asPrefixVerdictRollupHuman({
              rollup: input.prefix,
              absent: MARK_OF_ABSENT,
            }),
      // the window names the stone and its round count, so the move reads as a
      // claim about a comparable series rather than about the whole corpus
      trend: levers.trend
        ? {
            ...levers.trend,
            window: `${asCountedNoun({ count: window.buckets.length, one: 'round', many: 'rounds' })} of ${window.stone}`,
          }
        : undefined,
    }),
    `   │  ├─ tokens`,
    ...asTokenRowLines({
      prefix: '   │  │  ',
      figures: {
        input: asBucketTokensHuman({
          bucket: corpus,
          tokens: corpus.tokens.input,
        }),
        cacheSet: asBucketTokensHuman({
          bucket: corpus,
          tokens: corpus.tokens.cacheSet,
        }),
        cacheGet: asBucketTokensHuman({
          bucket: corpus,
          tokens: corpus.tokens.cacheGet,
        }),
        output: asBucketTokensHuman({
          bucket: corpus,
          tokens: corpus.tokens.output,
        }),
      },
    }),
    // 🔴 the standalone `cache:` line is retired, not lost — its figure and its
    // cold/warm caveat both moved into the lever block above, which is the one
    // place a reader now reads a cache rate at this breadth. to render it here
    // as well would put one figure on two lines, and a later edit would move one
    // of them (rule.require.single-source-of-truth-for-render)
    `   │  └─ cost: ${asCostHuman({ bucket: corpus })}${asUnknownCaveat({ unknown: corpus.runs.unknown })}`,
    '   │',
    // which INPUT bought the prompts — the stat the `grove` breadth carries, from the
    // same fold and the same render, so the input lever is actionable here too
    // (rule.require.report-both-cost-levers-with-trend-and-locus)
    ...asPromptInputsCensusLines({
      inputs: input.report.inputs,
      header: '   ├─ by input — what the prompts were MADE of',
      gutter: '   │  ',
      absent: MARK_OF_ABSENT,
    }),
    '   │',
    ...asAxisSection({
      title: 'reviewer',
      buckets: input.report.byReviewer,
      last: false,
      sort: 'rank',
    }),
    '   │',
    // the level axis sits beside reviewer, never at the tail. it is the
    // same axis read at a coarser grain — a guard's `level:` is a property
    // of a lane — so the two read as a pair, and a driver who asks "which
    // lane is dear?" gets "and which level is dear?" in the next breath
    ...asAxisSection({
      title: 'level',
      buckets: input.report.byLevel,
      last: false,
      sort: 'rank',
    }),
    '   │',
    // the provider axis sits beside the lane axes: a cache lives on the provider
    // that served the call, so a lane's low rate reads against where it landed
    ...asAxisSection({
      title: 'provider',
      buckets: input.report.byProvider,
      last: false,
      sort: 'rank',
    }),
    '   │',
    ...asAxisSection({
      title: 'stone',
      buckets: input.report.byStone,
      last: false,
      sort: 'rank',
    }),
    '   │',
    ...asAxisSection({
      title: 'round',
      buckets: input.report.byRound,
      // `round` is the last section only when the cross-tab is withheld. a
      // hardcoded `last: true` here would draw a `└─` and then reopen the
      // branch beneath it, which reads as a broken tree rather than a
      // deliberate shape (rule.forbid.snapshot-visual-blemishes)
      last: !input.trace,
      sort: 'key',
    }),
    // the cross-tab, opt-in — see the `trace` option's .why
    ...(input.trace
      ? [
          '   │',
          ...asAxisSection({
            title: 'round × reviewer',
            buckets: input.report.byRoundAndReviewer,
            last: true,
            sort: 'key',
          }),
        ]
      : []),
  ];

  return lines.join('\n');
};
