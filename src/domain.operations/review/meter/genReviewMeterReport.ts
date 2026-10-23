import type { IsoPriceWords } from 'iso-price';
import * as path from 'path';

import type { ReviewRunMeter } from '@src/domain.objects/Reviewer/ReviewRunMeter';
import type { ReviewTokens } from '@src/domain.objects/Reviewer/ReviewTokens';
import { getOneCacheHitRate } from '@src/domain.operations/review/getOneCacheHitRate';
import { getOneGradeCensus } from '@src/domain.operations/review/getOneGradeCensus';
import {
  getOnePromptInputsCensus,
  type PromptInputsCensus,
} from '@src/domain.operations/review/getOnePromptInputsCensus';
import { getOnePromptTokens } from '@src/domain.operations/review/getOnePromptTokens';
import { getOneReviewTokensOfRuns } from '@src/domain.operations/review/getOneReviewTokensOfRuns';
import {
  getAllLaneOrdinals,
  type LaneOrdinal,
} from '@src/domain.operations/review/meter/getAllLaneOrdinals';
import { getAllRunsAccounted } from '@src/domain.operations/review/meter/getAllRunsAccounted';
import { getAllRunsMetered } from '@src/domain.operations/review/meter/getAllRunsMetered';
import { getOneAccountedCost } from '@src/domain.operations/review/meter/getOneAccountedCost';
import {
  type CacheGrade,
  getOneCacheGrade,
} from '@src/domain.operations/review/meter/getOneCacheGrade';
import { SLUG_OF_ABSENT_IDENTITY } from '@src/domain.operations/review/SLUG_OF_ABSENT_IDENTITY';
import { compareStrings } from '@src/utils/compareStrings';

/**
 * .what = the key the meter files a run under when its reviewer's level is unknown
 * .why = the level lives in the guard, never in the log corpus, so a run whose guard
 *        cannot be read carries no level at all. it is bucketed under one visible
 *        name rather than folded into L1 — an unreadable guard and a declared L1
 *        must never render alike (rule.forbid.failhide).
 *
 * .note = takes the same `(no X — …)` shape as `SLUG_OF_ABSENT_IDENTITY`, its peer
 *         for an absent reviewer slug, so the two absences read as one family rather
 *         than as two unrelated strings.
 */
export const LEVEL_OF_ABSENT_GUARD = '(no level — guard unread)';

/**
 * .what = the key the meter files a run under when no provider was reported
 * .why = a refused run never reached a provider, and a brain with no supply report
 *        names none. one visible row, never a guess at which provider it was
 *        (rule.forbid.failhide). same `(no X — …)` shape as its two peers
 */
export const PROVIDER_OF_ABSENT_SUPPLY = '(no provider — unreported)';

/**
 * .what = one aggregated bucket of review runs — a reviewer, a stone, or a round
 * .why = every rollup the report offers has this identical shape, so one renderer
 *        serves all three axes and they cannot drift apart
 */
export interface ReviewMeterBucket {
  /** what this bucket is keyed by (a reviewer slug, a stone, a `stone i003`) */
  key: string;
  /**
   * how many runs fall in this bucket, by grade.
   *
   * `accounted` = metered + refused — the runs whose spend is known. a metered
   * run's spend was measured; a refused one never reached the brain, so its nil
   * is a fact. only an `unknown` run has spend nobody can account for, and it
   * is the one grade that must never fold into a figure.
   */
  runs: {
    total: number;
    metered: number;
    refused: number;
    unknown: number;
    accounted: number;
  };
  /** summed measured tokens across the metered runs of this bucket */
  tokens: ReviewTokens;
  /** summed spend over the accounted runs; null when no run here is accounted */
  cost: IsoPriceWords | null;
  /**
   * cached share of prompt tokens — cacheGet / (input + cacheSet + cacheGet).
   * null when the bucket holds no measured prompt token at all, since a rate
   * over a zero denominator is undefined, never 0%.
   */
  cacheHitRate: number | null;
  /**
   * whether this bucket's measured runs ever had a cache to hit — `cold` when
   * none had a prior run of its lane within the cache reach, `warm` when any
   * did. a cold grade names its cause: a first round, or a prefix that lapsed
   * past the reach. null exactly
   * when `cacheHitRate` is null, so the grade and the figure it qualifies are
   * non-null together, always.
   *
   * .why = a `0.0%` on a cold bucket is a fact about the world; the same figure
   *        on a warm one is a defect. see `getOneCacheGrade`.
   */
  cacheGrade: CacheGrade | null;
}

/**
 * .what = the full meter report over a corpus of review runs
 * .why = the single shape the renderer consumes
 */
export interface ReviewMeterReport {
  corpus: ReviewMeterBucket;
  byReviewer: ReviewMeterBucket[];
  /**
   * one row per guard-declared level — the coarser cut of `byReviewer` that
   * the guard already draws, and that the meter could not see.
   *
   * .why = a guard pours L1 before L3, so "what did L1 cost" is the natural
   *        first question about a stone's review bill — and to answer it
   *        used to take a hand join of the guard yaml against the reviewer
   *        rows, across ~20 file reads.
   *
   * .note = keyed `L1`, `L3`, …, plus `LEVEL_OF_ABSENT_GUARD` for every run
   *         whose guard could not be read. ranked, as its three marginal
   *         peers are.
   */
  byLevel: ReviewMeterBucket[];
  /**
   * one row per provider that served the answers — `supply.provider` from each
   * run, or `PROVIDER_OF_ABSENT_SUPPLY` where none was reported.
   *
   * .why = a prompt cache lives on the replica of the provider that served the
   *        call, so a cache rate near zero on a prompt that plainly repeats is a
   *        question about WHERE the calls landed before it is one about the prompt.
   *        without this axis the provider sat on every run and no report could
   *        total it (rule.forbid.adhoc-scope-rollups)
   */
  byProvider: ReviewMeterBucket[];
  byStone: ReviewMeterBucket[];
  byRound: ReviewMeterBucket[];
  /**
   * the cross-tab — one row per `<stone> i<NNN> · <slug>`.
   *
   * .why = the three axes above are three marginals of a table this report
   *        never formed, so "what did lane L cache in round N" — the one
   *        question that can show whether a lever moved — was unanswerable
   *        from any of them. `byReviewer` averages the step away outright:
   *        it reported `repo-rules 29.7%` over six rounds whose true series
   *        ran `0, 0, 8.4, 41.2, 7.3, 6.9`, and named no round at all.
   *
   * .note = key-ordered, never rank-ordered. see `getAllBucketsByKey`.
   */
  byRoundAndReviewer: ReviewMeterBucket[];
  /**
   * what this tree's review prompts were MADE of, by named input
   *
   * .why = the rollups say WHICH LANE spent the tokens and cannot say WHICH INPUT —
   *        so without this a tree reader could see the input lever's size and not
   *        name what to cut, a stat its `grove` peer already carried
   *        (rule.require.report-both-cost-levers-with-trend-and-locus).
   *
   * .note = read off each run's `metrics.compiled.json` (kilobytes), never the
   *         rendered prompt — the per-run locus that needs the megabyte read stays
   *         at `--of run`, the one breadth that reads one run
   */
  inputs: PromptInputsCensus;
}

/**
 * .what = folds a set of runs into one bucket
 * .why = the one place grade counts, token sums, spend, and cache rate are derived,
 *        so the corpus total and every row are computed by identical arithmetic
 */
const asReviewMeterBucket = (input: {
  key: string;
  runs: ReviewRunMeter[];
  ordinals: Map<string, LaneOrdinal>;
}): ReviewMeterBucket => {
  const metered = getAllRunsMetered({ runs: input.runs });

  const tokens = getOneReviewTokensOfRuns({ runs: metered });

  // the one grade census `--of grove` reads too, so the two breadths count
  // grades by construction and a new `ReviewRunGrade` lands in both
  // (rule.prefer.most-common-denominator)
  //
  // the row shape is not shared: `runs` below flattens the grades onto the
  // bucket, where `GroveRollupRow` nests them as `census`. that divergence is
  // `F8`'s to rule, so the census is read field by field rather than spread,
  // and the seam stays visible.
  const census = getOneGradeCensus({ runs: input.runs });

  // not `census.metered + census.refused`. that arithmetic is a second
  // expression of `isRunAccounted`, and it agrees with the predicate only
  // while the grade set holds exactly three values — a fourth grade would
  // land in whichever of the two sites its author had open
  const accounted = getAllRunsAccounted({ runs: input.runs }).length;

  return {
    key: input.key,
    runs: {
      total: input.runs.length,
      metered: census.metered,
      refused: census.refused,
      unknown: census.unknown,
      accounted,
    },
    tokens,
    // the absent/zero law lives in `getOneAccountedCost`, declared once so
    // this meter and the grove mine cannot drift on what "known spend"
    // means — they already had (see that operation's .why)
    cost: getOneAccountedCost({ runs: input.runs }),
    // and the rate is shared for the same reason the denominator already
    // was. `getOnePromptTokens` folded `input + cacheSet + cacheGet` into
    // one home and left the division in two — here, and in the grove mine —
    // with guards written in opposite polarity, which is exactly how two
    // copies of one formula stop to look like two copies
    // (rule.require.single-source-of-truth-for-render)
    cacheHitRate: getOneCacheHitRate({ tokens }),
    // the grade that says whether the rate above is a fact or a defect,
    // taken over the same metered runs the rate is, so the two describe one
    // object
    cacheGrade: getOneCacheGrade({
      runs: input.runs,
      ordinals: input.ordinals,
    }),
  };
};

/**
 * .what = groups runs by a derived key, in order of first sight
 * .why = one grouper serves all three axes
 *
 * .note = the sort key is the quantity the renderer shows, read through the
 *         same operation it reads (`getOnePromptTokens`). a rollup that
 *         ranks on one figure and prints another renders a column that
 *         reads as a broken sort, and the reader has no way to see which
 *         of the two is the lie (rule.require.single-source-of-truth-for-render).
 *         clamped by `genReviewMeterStdout.test.ts [case3]`, whose two lanes
 *         rank one way on input alone and the other way on prompt.
 */
const getAllBucketsByKey = (input: {
  runs: ReviewRunMeter[];
  asKey: (run: ReviewRunMeter) => string;
  ordinals: Map<string, LaneOrdinal>;
  /**
   * how the rows are ordered, an explicit choice rather than a default,
   * since the two orders serve two different jobs:
   *
   * - `rank` — heaviest first. a marginal exists to answer "which lane is
   *   dear?", and that question asks for a rank.
   * - `key`  — lexicographic. a cross-tab exists to answer "did this move
   *   between round 3 and round 4?", and a rank sort shuffles the very
   *   sequence that question reads along.
   *
   * named here rather than forked into a second grouper, so a reader meets
   * the divergence at the one place it is decided.
   */
  sort: 'rank' | 'key';
}): ReviewMeterBucket[] => {
  // .note = deliberate mutation, a scoped zone — `grouped` is born here and
  //         is spread into a fresh array before it is returned, so the map
  //         itself never escapes (rule.require.immutable-vars).
  //
  //         a group-by cannot be a `map`: many runs collapse onto one key, so
  //         the output is shorter than the input and keyed by a different
  //         axis. the accumulator carries what the earlier runs already put
  //         under each key, which is the dependence that makes it a fold
  //         rather than a projection.
  const grouped = new Map<string, ReviewRunMeter[]>();
  for (const run of input.runs) {
    const key = input.asKey(run);
    grouped.set(key, [...(grouped.get(key) ?? []), run]);
  }
  const buckets = [...grouped.entries()].map(([key, runs]) =>
    asReviewMeterBucket({ key, runs, ordinals: input.ordinals }),
  );

  // clone before sort, so the order is set on a list this operation owns
  return [...buckets].sort(ORDER_OF_BUCKETS[input.sort]);
};

/**
 * .what = the two bucket orders, by name
 * .why = `rank` leads with the bucket that sent the most prompt tokens, so the costliest
 *        reads first; `key` reads in axis order, for an axis whose sequence is the story
 *        (a round, a level). the choice is made once, by name, at the call
 *
 * .note = the grove rollup ranks on `getOneFullRateTokens`, not on prompt tokens, and
 *         the split is deliberate: each surface ranks on the figure its own row prints.
 *         `tree` prints the prompt total; `grove` prints the full-rate share. to align
 *         the two ranks is to align the two row shapes, which `F8` reserves
 */
const ORDER_OF_BUCKETS: Record<
  'rank' | 'key',
  (a: ReviewMeterBucket, b: ReviewMeterBucket) => number
> = {
  rank: (a, b) =>
    getOnePromptTokens({ tokens: b.tokens }) -
    getOnePromptTokens({ tokens: a.tokens }),
  key: (a, b) => compareStrings(a.key, b.key),
};

/**
 * .what = the round a run belongs to — `<stone> i<NNN>`, led by `<route> · ` where the
 *         corpus spans more than one route — or null with no guard identity
 * .why = the round axis and the cross-tab both key on it, so it is spelled once
 *
 * .note = a round is per route: route A's `5.1 i003` and route B's are two rounds, and
 *         a key that drops the route sums them into one row whose cache rate is an
 *         average over two unrelated series. the route leads only where the corpus
 *         holds two or more, so a single-route tree — the common case — reads as it
 *         did, and the prefix sort still keeps each route's rounds in order
 */
const asRoundKey = (input: {
  run: ReviewRunMeter;
  isRouteQualified: boolean;
}): string | null => {
  if (!input.run.identity) return null;
  const round = `${input.run.identity.stone} i${String(input.run.identity.iteration).padStart(3, '0')}`;
  if (!input.isRouteQualified) return round;
  const route = input.run.identity.route
    ? path.basename(input.run.identity.route)
    : SLUG_OF_ABSENT_IDENTITY;
  return `${route} · ${round}`;
};

/**
 * .what = whether the corpus holds the guard runs of more than one route
 * .why = names the decision `asRoundKey` qualifies on, so the fold reads it by name
 */
const isCorpusOfManyRoutes = (input: { runs: ReviewRunMeter[] }): boolean =>
  new Set(
    input.runs
      .filter((run) => run.identity !== null)
      .map((run) => run.identity?.route ?? null),
  ).size > 1;

/**
 * .what = the level a run's reviewer sits at — `L<N>` — or `LEVEL_OF_ABSENT_GUARD`
 *         where the guard declared none for its run dir
 * .why = the level axis keys on it. `L1`, never a bare `1`: the key renders verbatim
 *        into a treestruct row beside keys like `repo-rules` and
 *        `5.1.execution.from_vision i003`, and a lone digit there reads as a count
 *        rather than as a level
 */
const asLevelKeyOfRun = (input: {
  run: ReviewRunMeter;
  levels: Map<string, number>;
}): string => {
  const level = input.levels.get(input.run.dir);
  return level === undefined ? LEVEL_OF_ABSENT_GUARD : `L${level}`;
};

/**
 * .what = the cross-tab key of a run — `<stone> i<NNN> · <reviewer>` — or
 *         `SLUG_OF_ABSENT_IDENTITY` with no guard identity
 * .why = the round-by-reviewer axis keys on it. keyed off `identity` rather than off
 *        `asRoundKey`'s null, so the narrow that makes `.slug` reachable is the
 *        compiler's rather than a non-null assertion the reader must verify by hand
 */
const asRoundAndReviewerKeyOfRun = (input: {
  run: ReviewRunMeter;
  isRouteQualified: boolean;
}): string =>
  input.run.identity
    ? `${asRoundKey(input)} · ${input.run.identity.slug}`
    : SLUG_OF_ABSENT_IDENTITY;

/**
 * .what = builds the meter report over a corpus of review runs
 * .why = answers "which reviewer, on which stone, at which round, cost what" — the
 *        three axes a grove total hides
 */
export const genReviewMeterReport = (input: {
  runs: ReviewRunMeter[];
  /**
   * the guard-declared level of each run's reviewer, keyed by run dir — from
   * `getAllReviewerLevels`. an absent key means unknown, and is filed under
   * `LEVEL_OF_ABSENT_GUARD` rather than defaulted to 1.
   *
   * required, so a caller states what it knows. a caller with no guard to
   * read — a unit test, a consumer that hands in a corpus — passes an empty
   * map, and every run lands in one honestly-named row, never a wrong figure.
   */
  levels: Map<string, number>;
}): ReviewMeterReport => {
  const levels = input.levels;
  // derived once over the whole corpus, then handed to every bucket. the
  // ordinal is a property of a run's position among its lane's runs
  // corpus-wide, so a per-bucket derivation would count a lane's repeats
  // within each axis separately and grade the same run `cold` on one axis
  // and `warm` on another
  const ordinals = getAllLaneOrdinals({ runs: input.runs });

  // a round key carries its route only where two routes could share a round name
  const isRouteQualified = isCorpusOfManyRoutes({ runs: input.runs });

  return {
    corpus: asReviewMeterBucket({ key: 'corpus', runs: input.runs, ordinals }),
    byReviewer: getAllBucketsByKey({
      runs: input.runs,
      ordinals,
      sort: 'rank',
      asKey: (run) => run.identity?.slug ?? SLUG_OF_ABSENT_IDENTITY,
    }),
    byLevel: getAllBucketsByKey({
      runs: input.runs,
      ordinals,
      sort: 'rank',
      asKey: (run) => asLevelKeyOfRun({ run, levels }),
    }),
    byProvider: getAllBucketsByKey({
      runs: input.runs,
      ordinals,
      sort: 'rank',
      asKey: (run) => run.provider ?? PROVIDER_OF_ABSENT_SUPPLY,
    }),
    byStone: getAllBucketsByKey({
      runs: input.runs,
      ordinals,
      sort: 'rank',
      asKey: (run) => run.identity?.stone ?? SLUG_OF_ABSENT_IDENTITY,
    }),
    byRound: getAllBucketsByKey({
      runs: input.runs,
      ordinals,
      // a round axis is the trend: read in sequence, never by weight, so the
      // round-over-round move of input size and cache rate reads in order
      sort: 'key',
      asKey: (run) =>
        asRoundKey({ run, isRouteQualified }) ?? SLUG_OF_ABSENT_IDENTITY,
    }),
    byRoundAndReviewer: getAllBucketsByKey({
      runs: input.runs,
      ordinals,
      // sorts by key, as `byRound` does. a cross-tab is read along its
      // rounds, so a rank sort would shuffle the sequence its whole purpose
      // is to trace
      sort: 'key',
      asKey: (run) => asRoundAndReviewerKeyOfRun({ run, isRouteQualified }),
    }),
    // what the prompts were MADE of — the same fold the `grove` breadth runs, so a
    // breadth cannot omit a stat its peer carries
    // (rule.require.report-both-cost-levers-with-trend-and-locus)
    inputs: getOnePromptInputsCensus({ runs: input.runs }),
  };
};
