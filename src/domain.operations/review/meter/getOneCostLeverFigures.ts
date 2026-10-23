import type { ReviewTokens } from '@src/domain.objects/Reviewer/ReviewTokens';
import { asCountHuman } from '@src/domain.operations/review/asCountHuman';
import { asRateHuman } from '@src/domain.operations/review/asRateHuman';
import { getOnePromptTokens } from '@src/domain.operations/review/getOnePromptTokens';
import { getOneLeverCacheMovePoints } from '@src/domain.operations/review/meter/getOneLeverCacheMovePoints';
import { getOneLeverInputMovePercent } from '@src/domain.operations/review/meter/getOneLeverInputMovePercent';
import { getOneLeverSeriesBounds } from '@src/domain.operations/review/meter/getOneLeverSeriesBounds';
import { asCountedNoun } from '@src/utils/asCountedNoun';

/**
 * .what = the minimum a bucket must carry to be read as a lever sample
 * .why = declared structurally rather than as `ReviewMeterBucket`, so the grove
 *        surface — whose rows are a different shape with the same two figures —
 *        can feed this one operation rather than fork a second copy of the
 *        arithmetic (rule.forbid.duplicate-format-tree-operations)
 */
export interface CostLeverSample {
  /** how many runs here were measured; the divisor of the per-run figure */
  metered: number;
  tokens: ReviewTokens;
  /** cacheGet / (input + cacheSet + cacheGet); null over a zero denominator */
  cacheHitRate: number | null;
}

/**
 * .what = the two levers, rendered, plus their trend where a series supports one
 * .why = review cost has exactly two levers and they multiply into the bill, so
 *        every breadth owes both. the arithmetic lives here once because three
 *        breadths read it, and a per-breadth copy would let one drift to a
 *        different divisor and report a different lever for one corpus
 *        (rule.require.report-both-cost-levers-with-trend-and-locus).
 *
 * 🔴 .note = the input lever is PER RUN, never the corpus total. a total rises
 *     with the run count alone, so a trend on it reports "input went up" for a
 *     tree that merely ran more rounds at a smaller prompt each — the exact
 *     confound the lever exists to expose. the divisor is `metered`, since only
 *     a metered run contributed a token.
 *
 * .note = `trend` is absent rather than zero where a series cannot support one —
 *         a single sample, or a corpus with no time axis. a `→ flat` on one data
 *         point is a claim about a change nobody observed.
 */
export const getOneCostLeverFigures = (input: {
  /** the whole corpus, as one sample */
  corpus: CostLeverSample;
  /**
   * the corpus cut along a TIME axis, oldest first, for the trend.
   *
   * .note = absent where the breadth has no time axis. the grove passes its
   *         `byDay` cut, never its by-tree rows — a tree is a place rather than a
   *         time, and a trend over trees would read as a trend over rounds.
   */
  series?: CostLeverSample[];
  /**
   * the absent form this breadth prints — the tree's MARK or the grove's WORD
   * (`asFigureHuman`). taken as an input, as `asRateHuman` takes it, so the
   * lever rows never re-type a glyph that could drift from its surface
   */
  absent: string;
}): {
  figures: { input: string; cache: string };
  trend?: { input: string; cache: string };
} => {
  const figures = {
    input: asLeverInputHuman({ sample: input.corpus, absent: input.absent }),
    cache: asLeverCacheHuman({ sample: input.corpus, absent: input.absent }),
  };

  // only the two ends of a MEASURED series bound a trend; fewer than two, no trend
  const bounds = getOneLeverSeriesBounds({ series: input.series ?? [] });
  if (bounds === null) return { figures };

  // the input lever moves in percent of its first figure; the cache lever in points
  const inputMove = getOneLeverInputMovePercent(bounds);
  const cacheMove = getOneLeverCacheMovePoints(bounds);

  return {
    figures,
    trend: {
      input: asLeverMoveHuman({
        by: inputMove,
        unit: '%',
        goodWhenDown: true,
        absent: input.absent,
      }),
      cache: asLeverMoveHuman({
        by: cacheMove,
        unit: 'pp',
        goodWhenDown: false,
        absent: input.absent,
      }),
    },
  };
};

/**
 * .what = the input lever of one sample, rendered as prompt tokens per metered run
 * .why = a corpus with no metered run has no per-run figure; an `unknown` cost renders
 *        ABSENT and never `0`, and the same law binds its lever
 *
 * .note = the noun agrees with the ROUNDED figure a reader sees, so a corpus that
 *         averaged one token reads `1 prompt token/run`, never `1 prompt tokens/run`
 */
const asLeverInputHuman = (input: {
  sample: CostLeverSample;
  absent: string;
}): string => {
  if (input.sample.metered <= 0) return input.absent;
  const perRun =
    getOnePromptTokens({ tokens: input.sample.tokens }) / input.sample.metered;
  return asCountedNoun(
    {
      count: Math.round(perRun),
      one: 'prompt token/run',
      many: 'prompt tokens/run',
    },
    { figure: (count) => asCountHuman({ of: count }) },
  );
};

/**
 * .what = the cache lever of one sample, rendered as a hit rate
 * .why = the one rate render the bucket rows read too, so the lever header and the rows
 *        beneath it cannot part on a decimal or an absent mark within one report
 */
const asLeverCacheHuman = (input: {
  sample: CostLeverSample;
  absent: string;
}): string =>
  asRateHuman({ of: input.sample.cacheHitRate, absent: input.absent });

/**
 * .what = one lever's move, rendered as an arrow, a magnitude, and a verdict
 * .why = the verdict is the whole point of the trend: a reader must not have to recall
 *        which lever is good when it falls
 */
const asLeverMoveHuman = (input: {
  by: number | null;
  unit: string;
  goodWhenDown: boolean;
  absent: string;
}): string => {
  if (input.by === null) return input.absent;
  if (Math.abs(input.by) < 0.05) return '→ flat';
  const arrow = input.by < 0 ? '↓' : '↑';
  const verdict = input.by < 0 === input.goodWhenDown ? '🎉' : '🔴';
  return `${arrow} ${Math.abs(input.by).toFixed(1)}${input.unit} ${verdict}`;
};
