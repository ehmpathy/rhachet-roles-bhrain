import {
  asIsoPrice,
  asIsoPriceShape,
  type IsoPriceWords,
  priceSub,
  priceSum,
} from 'iso-price';
import * as path from 'path';

import { asLogDirMintedAt } from '@src/domain.operations/review/asLogDirMintedAt';
import {
  asReviewLane,
  type ReviewLane,
} from '@src/domain.operations/review/asReviewLane';
import { asReviewLaneKey } from '@src/domain.operations/review/asReviewLaneKey';
import { asRunDirChronologicalOrder } from '@src/domain.operations/review/asRunDirChronologicalOrder';
import { isReviewLanePrefixSuperseded } from '@src/domain.operations/review/isReviewLanePrefixSuperseded';
import { isReviewRunDirLater } from '@src/domain.operations/review/isReviewRunDirLater';
import { isSameReviewer } from '@src/domain.operations/review/isSameReviewer';
import { isSameReviewLane } from '@src/domain.operations/review/isSameReviewLane';
import { MINUTES_OF_CACHE_REACH } from '@src/domain.operations/review/MINUTES_OF_CACHE_REACH';
import type { ReviewRunMeter } from '@src/domain.operations/review/ReviewRunMeter';
import { asWarmerLastPokedAt } from '@src/domain.operations/review/warmer/asWarmerLastPokedAt';
import { getOneMinutesElapsed } from '@src/domain.operations/review/warmer/getOneMinutesElapsed';
import type { WarmerCost } from '@src/domain.operations/review/warmer/getOneWarmerCost';
import { compareStrings } from '@src/utils/compareStrings';

/**
 * .what = what a verdict on the warmer can honestly claim, from the artifacts alone
 *
 * - `unproven` = no warmed run has settled yet — none was followed by a priced review,
 *                and none has lapsed — so there is no amount saved to weigh the spend against
 * - `loss`     = the settled pokes cost MORE than the whole amount their followers'
 *                cache saved. that amount is an upper bound on what the warmer bought,
 *                so the warmer did not pay for itself. a further review inside a warmer's
 *                reach only adds to the amount saved, so the verdict is final once every
 *                settled warmer's reach has closed
 * - `maybe`    = the settled pokes cost less than the upper bound. the warmer MAY have
 *                paid; a read inside the cache ttl would have hit with no poke at all,
 *                so only a `--warmer off` control lane can settle it
 *
 * .note = the verdict weighs SETTLED pairs alone, and a warmed run settles one of two ways:
 *
 *         | settle   | when                                                        | saved           |
 *         |----------|-------------------------------------------------------------|-----------------|
 *         | followed | every later run of the lane in reach, up to the next warmed | their cache     |
 *         |          | run, is priced, and the window has closed                   | saved, summed   |
 *         | lapsed   | the lane moved to a new head, or the cache reach has passed | naught — a fact |
 *
 *         a lapsed run is final by construction: no later review can read a prefix the
 *         lane no longer sends, nor one past the cache reach. so a finished lane's last
 *         warmed run settles at naught once its reach passes, and `loss` stays reachable.
 *
 *         two kinds stay UNWEIGHED, beside the net as `costAwaited`, never inside it:
 *         a run still within reach of a review that may yet come — whether or not one
 *         already followed, since a later one would add to its saved — and a run whose
 *         follower is unpriced — a review read its warmth, and what that saved is unknown
 */
export type WarmerValueVerdict = 'unproven' | 'loss' | 'maybe';

/**
 * .what = the warmer's value within one lane, or across a whole corpus
 */
export interface WarmerValue {
  /** the reviewer slug of the lane (`asReviewLane`); `total` for the corpus row */
  key: string;
  /**
   * the whole lane — root, slug, and head — or null for the corpus row.
   *
   * carried beside `key` because `key` is a display label: two worktrees share
   * slugs, and one slug with two heads is two lanes. a consumer that groups rows
   * must group on this, never on `key` (`asReviewLaneKey`)
   */
  lane: ReviewLane | null;
  /** the cost of every poke a warmer in scope sent — settled and unweighed alike */
  cost: IsoPriceWords;
  /**
   * the cost of the pokes whose benefit is unweighed — a warmed run still within
   * reach of a later review, or one whose follower is unpriced. a part of `cost`,
   * kept out of `net`
   */
  costAwaited: IsoPriceWords;
  /**
   * true where any warmer in scope had a fault or its record was truncated —
   * then `cost` is a floor, never the whole figure, and a `loss` verdict only
   * grows more certain
   */
  costIsFloor: boolean;
  /**
   * the faulted pokes across every warmer in scope — each may have billed unmeasured.
   * one of the two causes behind `costIsFloor`, carried so a render can NAME it
   */
  faults: number;
  /**
   * the warmers in scope whose log has no terminator — each still AWAKE or STOPPED,
   * its plan unspent. the other cause behind `costIsFloor`; an awake warmer is the
   * common case at review cadence, so a render must never call it damage
   */
  runsUnterminated: number;
  pokes: number;
  hits: number;
  /** what the cache saved the reviews that followed a warmed run — an upper bound */
  saved: IsoPriceWords;
  /** how many priced reviews followed a warmed run */
  reviewsCovered: number;
  /** warmed runs whose benefit is unweighed — the runs `costAwaited` was spent on */
  runsUncovered: number;
  /**
   * the part of `runsUncovered` whose follower is unpriced — a review DID read the
   * warmth, and its amount saved went unrecorded. unlike an awaited run, these will
   * never settle, so a render must not promise that they will
   */
  runsUnpriced: number;
  /**
   * warmed runs settled at naught saved — the lane moved to a new head, or the cache
   * reach passed with no review to read the warmth. their cost is inside `net`
   */
  runsLapsed: number;
  /** `saved − (cost − costAwaited)` — the settled pairs alone; negative is a loss */
  net: IsoPriceWords;
  verdict: WarmerValueVerdict;
}

/**
 * .what = how one warmed run stands against the reviews that could read its warmth
 *
 * - `followed` = priced reviews of the lane followed it in reach, and its window has closed;
 *                settled at their cache saved
 * - `lapsed`   = settled at naught: the lane moved to a new head, or the cache reach passed
 * - `unpriced` = a review of the lane followed it, and that review's cache saved is
 *                unpriced — so the benefit is unweighed, and stays so
 * - `awaited`  = its warmth is still within reach of a review that may yet come — none has
 *                followed it yet, or the ones that did are priced but the window is open
 */
type WarmerPairSettle = 'followed' | 'lapsed' | 'unpriced' | 'awaited';

/**
 * .what = a warmed run, paired with the reviews its warmth could have served
 * .why = the atom both the lane rows and the total are folded from, so the two
 *        cannot disagree about which review a poke bought
 */
interface WarmerPair {
  lane: ReviewLane | null;
  warmer: WarmerCost;
  settle: WarmerPairSettle;
  /** the priced reviews that followed in reach — empty unless `settle` is `followed` */
  followers: Array<{ dir: string; cacheSaved: IsoPriceWords }>;
}

/**
 * .what = the runs of a warmer's window that started before its reach passed
 * .why = a review that started past the reach found a prefix the warmer no longer held,
 *        so only the runs in reach could have read the warmth
 */
const getAllRunsInWarmerReach = (input: {
  warmer: WarmerCost;
  window: ReviewRunMeter[];
}): ReviewRunMeter[] =>
  input.window.filter(
    (next) =>
      !isWarmerReachPassed({
        warmer: input.warmer,
        now: asLogDirMintedAt({ name: path.basename(next.dir) }),
      }),
  );

/**
 * .what = the runs in reach whose cache saved is priced, each with its saved
 * .why = an unpriced run carries no saved to credit, so it is left out here and the
 *        caller compares the two counts to tell a full price from a partial one
 */
const getAllPricedFollowers = (input: {
  inReach: ReviewRunMeter[];
}): WarmerPair['followers'] =>
  input.inReach.flatMap((next) => {
    const cacheSaved = next.cost?.cacheSaved ?? null;
    return cacheSaved === null ? [] : [{ dir: next.dir, cacheSaved }];
  });

/**
 * .what = classify one warmed run against the corpus and the clock
 * .why = the order is the order of evidence: reviews that followed WITHIN REACH of the
 *        warmer's last ledger row are the strongest fact about the warmth, so they decide first.
 *        each one read the warmth, so each one's cache saved is credited — not the first
 *        alone. a review that started past the reach found a prefix the warmer no longer
 *        held, so a warmer whose window holds only such reviews lapses at naught. only a
 *        run no review followed can lapse otherwise, and only one that has not is awaited
 */
const asWarmerPair = (input: {
  run: ReviewRunMeter;
  warmer: WarmerCost;
  runs: ReviewRunMeter[];
  now: Date;
}): WarmerPair => {
  const lane = asReviewLane({ run: input.run });
  const window = getAllRunsInWarmerWindow(input);
  const inReach = getAllRunsInWarmerReach({ warmer: input.warmer, window });

  // every review that read the warmth is priced, and no further one can come: the pair
  // settles at their sum. while the window is still open, a later review in reach would
  // add to the saved, so a settle now would weigh a partial sum as the whole one
  const followers = getAllPricedFollowers({ inReach });
  const isPricedInFull =
    inReach.length > 0 && followers.length === inReach.length;
  if (isPricedInFull && isWarmerWindowClosed({ ...input, window }))
    return { lane, warmer: input.warmer, settle: 'followed', followers };
  if (isPricedInFull)
    return { lane, warmer: input.warmer, settle: 'awaited', followers: [] };

  // a review read the warmth and its saved is unknown: the benefit is unweighed
  if (inReach.length > 0)
    return { lane, warmer: input.warmer, settle: 'unpriced', followers: [] };

  // reviews came, all past the reach: none read the warmth, so it lapsed at naught
  if (window.length > 0)
    return { lane, warmer: input.warmer, settle: 'lapsed', followers: [] };

  // no review followed: the warmth lapsed where no review can read it any more
  if (isWarmerPairLapsed(input))
    return { lane, warmer: input.warmer, settle: 'lapsed', followers: [] };

  // otherwise a review may yet come within reach
  return { lane, warmer: input.warmer, settle: 'awaited', followers: [] };
};

/**
 * .what = whether no later review can read a warmed run's warmth
 * .why = two facts each settle it: the lane moved to a new head, so the prefix is no
 *        longer sent; or the cache reach passed since the warmer's last row, so the
 *        prefix is no longer held
 */
const isWarmerPairLapsed = (input: {
  run: ReviewRunMeter;
  warmer: WarmerCost;
  runs: ReviewRunMeter[];
  now: Date;
}): boolean =>
  isReviewLaneSuperseded(input) ||
  isWarmerReachPassed({ warmer: input.warmer, now: input.now });

/**
 * .what = whether a warmed run's window can take no further follower
 * .why = a followed pair's saved is final only once no later review can join it. the
 *        window stays open only while all three hold: no later warmed run of the lane
 *        claimed the runs after it, the lane still sends this prefix, and the cache reach
 *        is MEASURABLY open at `now`
 *
 * .note = a ledger with no row, or one whose stamp does not parse, has no instant to
 *         measure the reach from, so it cannot show an open reach. its followers are
 *         then the strongest fact, and the pair settles on them
 */
const isWarmerWindowClosed = (input: {
  run: ReviewRunMeter;
  warmer: WarmerCost;
  runs: ReviewRunMeter[];
  now: Date;
  window: ReviewRunMeter[];
}): boolean => {
  // the window ends at the next warmed run, which hands every later run to its own warmer
  const isClaimedByNextWarmed = (input.window.at(-1)?.warmer ?? null) !== null;
  if (isClaimedByNextWarmed || isReviewLaneSuperseded(input)) return true;
  return !isWarmerReachOpen({ warmer: input.warmer, now: input.now });
};

/**
 * .what = whether the cache reach is measurably open, at `now`, since the warmer's last row
 * .why = the positive twin of `isWarmerReachPassed`: absent or unparseable stamps answer
 *        false here AND there, since neither an open reach nor a passed one can be shown
 */
const isWarmerReachOpen = (input: {
  warmer: WarmerCost;
  now: Date;
}): boolean => {
  // with no instant to measure from, an open reach cannot be shown
  if (asWarmerLastPokedAt({ warmer: input.warmer }) === null) return false;
  return !isWarmerReachPassed(input);
};

/**
 * .what = whether a later run of the same root and slug ran with a different prefix
 * .why = a new head or a new brain is a new prefix, so the old lane's prefix is sent by
 *        no later run. the rule is `isReviewLanePrefixSuperseded`, the one the warmer
 *        spawn retires by, so the fold and the spawn cannot disagree
 */
const isReviewLaneSuperseded = (input: {
  run: ReviewRunMeter;
  runs: ReviewRunMeter[];
}): boolean => {
  const lane = asReviewLane({ run: input.run });
  if (!lane) return false;
  return input.runs.some((other) => {
    const laneOther = asReviewLane({ run: other });
    return (
      laneOther !== null &&
      isReviewRunDirLater({ run: other, than: input.run }) &&
      isSameReviewer({ a: laneOther, b: lane }) &&
      isReviewLanePrefixSuperseded({ asked: laneOther, live: lane })
    );
  });
};

/**
 * .what = whether the cache reach has passed, at `now`, since the warmer's last row
 * .why = a ledger with no row has no instant to measure from, so it cannot lapse
 *
 * .note = the reach is `MINUTES_OF_CACHE_REACH`: the first gap at which
 *         `CENSUS_OF_CACHE_REACH` measured a hit rate of 0. no margin is added; a lapse
 *         past it is a measured fact, not a guess. `now` is
 *         the wall clock for a run no review followed, and the follower's start for one
 *         that a review did
 */
const isWarmerReachPassed = (input: {
  warmer: WarmerCost;
  now: Date;
}): boolean => {
  // a ledger with no row, or a row whose stamp does not parse, has no instant to
  // measure from — so it cannot lapse, and is read the same as an absent row
  const lastAt = asWarmerLastPokedAt({ warmer: input.warmer });
  if (lastAt === null) return false;
  return (
    getOneMinutesElapsed({ since: lastAt, until: input.now }) >=
    MINUTES_OF_CACHE_REACH
  );
};

/**
 * .what = whether `other` is a run of `run`'s lane that reached the brain, and started AFTER it
 * .why = a dir basename leads with its stamp, so a string compare is a time compare
 *
 * .note = an `unknown` run counts: it compiled its prompt and may well have called the
 *         brain, so it may have read the warmth — its saved is merely unrecorded, which
 *         routes the pair to `unpriced`. to drop it would settle the pair `lapsed` at $0
 *         saved, the `unknown`-as-zero inversion this meter exists to refuse. a `refused`
 *         run stays out: it died at validation, so no brain call read aught
 */
const isLaterBrainRunOfLane = (input: {
  run: ReviewRunMeter;
  other: ReviewRunMeter;
}): boolean =>
  input.other.grade !== 'refused' &&
  isReviewRunDirLater({ run: input.other, than: input.run }) &&
  isSameReviewLane({
    a: asReviewLane({ run: input.run }),
    b: asReviewLane({ run: input.other }),
  });

/**
 * .what = the later runs of `run`'s lane, that reached the brain, its warmer could have served
 * .why = the window closes at the next warmed run of the lane: that run is the last one
 *        this warmer served, and every run after it is the next warmer's to claim
 */
const getAllRunsInWarmerWindow = (input: {
  run: ReviewRunMeter;
  runs: ReviewRunMeter[];
}): ReviewRunMeter[] => {
  // clone before the sort, so the order of no list but this copy can change
  const later = [
    ...input.runs.filter((other) =>
      isLaterBrainRunOfLane({ run: input.run, other }),
    ),
  ].sort((a, b) => asRunDirChronologicalOrder({ a, b }));
  return getAllRunsThroughNextWarmed({ later });
};

/**
 * .what = the chronological runs up to and INCLUDING the first one that spawned a warmer
 * .why = that run read this warmer's warmth before it started its own, so it is the last run
 *        this warmer served; every run past it belongs to the next warmer
 *
 * .note = no warmed run → every run is in the window
 */
const getAllRunsThroughNextWarmed = (input: {
  later: ReviewRunMeter[];
}): ReviewRunMeter[] => {
  const indexOfNextWarmed = input.later.findIndex(
    (other) => other.warmer !== null,
  );
  if (indexOfNextWarmed === -1) return input.later;
  return input.later.slice(0, indexOfNextWarmed + 1);
};

/**
 * .what = the verdict a set of figures supports
 * .why = the verdict is the one row a reader acts on, so it is derived here from the
 *        same figures the rows print, never judged apart from them
 *
 * .note = the sign reads the shape's bigint amount. iso-price@1.1.1 ships no
 *         `.lesser` comparator, so this is the lossless compare it offers
 */
const asWarmerValueVerdict = (input: {
  runsSettled: number;
  net: IsoPriceWords;
}): WarmerValueVerdict => {
  // no settled pair to weigh against — the spend has no measured counterpart yet
  if (input.runsSettled === 0) return 'unproven';

  // the net weighs settled pairs alone, so below zero is final
  if (asIsoPriceShape(input.net).amount < 0n) return 'loss';

  // otherwise it may have paid; only a control lane can say
  return 'maybe';
};

/**
 * .what = fold a set of pairs into one value row
 * .note = each follower is counted ONCE. two warmed runs in a row may share a
 *         review, and to count its amount saved twice would double the benefit
 */
const asWarmerValue = (input: {
  key: string;
  lane: ReviewLane | null;
  pairs: WarmerPair[];
}): WarmerValue => {
  // the distinct reviews that followed a warmed run
  const followers = getAllFollowersDistinct({ pairs: input.pairs });

  // the pairs by how they stand
  const pairsUnweighed = getAllPairsUnweighed({ pairs: input.pairs });
  const pairsLapsed = getAllPairsBySettle({
    pairs: input.pairs,
    settle: 'lapsed',
  });

  // what the pokes cost, the unweighed part, what the cache saved, and the
  // difference over the settled part alone
  const cost = getOnePokesCostOfPairs({ pairs: input.pairs });
  const costAwaited = getOnePokesCostOfPairs({ pairs: pairsUnweighed });
  const saved = getOneCacheSavedOfFollowers({ followers });
  const net = asIsoPrice(priceSub(saved, priceSub(cost, costAwaited)));

  return {
    key: input.key,
    lane: input.lane,
    cost,
    costAwaited,
    costIsFloor: isAnyWarmerCostFloor({ pairs: input.pairs }),
    faults: getOneWarmerCountSum({ pairs: input.pairs, of: 'faults' }),
    runsUnterminated: getAllPairsUnterminated({ pairs: input.pairs }).length,
    pokes: getOneWarmerCountSum({ pairs: input.pairs, of: 'pokes' }),
    hits: getOneWarmerCountSum({ pairs: input.pairs, of: 'hits' }),
    saved,
    reviewsCovered: followers.length,
    runsUncovered: pairsUnweighed.length,
    runsUnpriced: getAllPairsBySettle({
      pairs: pairsUnweighed,
      settle: 'unpriced',
    }).length,
    runsLapsed: pairsLapsed.length,
    net,
    verdict: asWarmerValueVerdict({
      runsSettled: followers.length + pairsLapsed.length,
      net,
    }),
  };
};

/**
 * .what = the distinct reviews that followed a warmed run, keyed on their dir
 * .why = each follower is counted ONCE — two warmed runs in a row may share a review
 */
const getAllFollowersDistinct = (input: {
  pairs: WarmerPair[];
}): WarmerPair['followers'] => [
  ...new Map(
    input.pairs.flatMap((pair) =>
      pair.followers.map((follower) => [follower.dir, follower] as const),
    ),
  ).values(),
];

/**
 * .what = what every poke in the pairs cost, summed
 */
const getOnePokesCostOfPairs = (input: {
  pairs: WarmerPair[];
}): IsoPriceWords =>
  asIsoPrice(priceSum('USD 0', ...input.pairs.map((pair) => pair.warmer.cost)));

/**
 * .what = what the cache saved the followers, summed — an upper bound on what a warmer bought
 */
const getOneCacheSavedOfFollowers = (input: {
  followers: WarmerPair['followers'];
}): IsoPriceWords =>
  asIsoPrice(
    priceSum(
      'USD 0',
      ...input.followers.map((follower) => follower.cacheSaved),
    ),
  );

/**
 * .what = whether any warmer's cost is a FLOOR rather than a total
 * .why = a fault may have billed unmeasured, and a truncated ledger may have cut a poke short
 */
const isAnyWarmerCostFloor = (input: { pairs: WarmerPair[] }): boolean =>
  input.pairs.some((pair) => pair.warmer.faults > 0 || pair.warmer.truncated);

/**
 * .what = one warmer count, summed across the pairs
 */
const getOneWarmerCountSum = (input: {
  pairs: WarmerPair[];
  of: 'pokes' | 'hits' | 'faults';
}): number => input.pairs.reduce((sum, pair) => sum + pair.warmer[input.of], 0);

/**
 * .what = the warmed runs whose benefit is unweighed — awaited, or followed unpriced
 */
const getAllPairsUnweighed = (input: { pairs: WarmerPair[] }): WarmerPair[] =>
  input.pairs.filter(
    (pair) => pair.settle === 'awaited' || pair.settle === 'unpriced',
  );

/**
 * .what = the warmed runs that settled one way — lapsed, unpriced, awaited, or followed
 */
const getAllPairsBySettle = (input: {
  pairs: WarmerPair[];
  settle: WarmerPair['settle'];
}): WarmerPair[] => input.pairs.filter((pair) => pair.settle === input.settle);

/**
 * .what = the warmed runs whose warmer ledger was cut short, so its cost is a floor
 */
const getAllPairsUnterminated = (input: {
  pairs: WarmerPair[];
}): WarmerPair[] => input.pairs.filter((pair) => pair.warmer.truncated);

/**
 * .what = each warmed run, paired with the reviews its warmth could have served
 * .why = a run with no warmer has no poke to weigh, so it yields no pair
 */
const asWarmerPairs = (input: {
  runs: ReviewRunMeter[];
  now: Date;
}): WarmerPair[] =>
  input.runs.flatMap((run) =>
    run.warmer
      ? [
          asWarmerPair({
            run,
            warmer: run.warmer,
            runs: input.runs,
            now: input.now,
          }),
        ]
      : [],
  );

/**
 * .what = one value row per distinct lane, key-ordered
 * .why = key order makes a rerun render the same rows in the same order; a pair with
 *        no lane has no row of its own, and still counts toward the total
 */
const asWarmerLaneValues = (input: { pairs: WarmerPair[] }): WarmerValue[] =>
  // one row per lane, folded from that lane's pairs alone
  getAllLanesDistinctOrdered({ pairs: input.pairs }).map((lane) =>
    asWarmerValue({
      key: lane.slug,
      lane,
      pairs: getAllPairsOfLane({ pairs: input.pairs, lane }),
    }),
  );

/**
 * .what = the pairs that belong to one lane
 */
const getAllPairsOfLane = (input: {
  pairs: WarmerPair[];
  lane: ReviewLane;
}): WarmerPair[] =>
  input.pairs.filter((pair) =>
    isSameReviewLane({ a: pair.lane, b: input.lane }),
  );

/**
 * .what = the distinct lanes among the pairs, keyed by `asReviewLaneKey`, key-ordered
 * .why = key order makes a rerun render the same rows in the same order
 */
const getAllLanesDistinctOrdered = (input: {
  pairs: WarmerPair[];
}): Array<ReviewLane> =>
  [
    ...new Map(
      input.pairs.flatMap((pair) =>
        pair.lane
          ? [[asReviewLaneKey({ lane: pair.lane }), pair.lane] as const]
          : [],
      ),
    ).entries(),
  ]
    // the spread above is the clone; the sort reorders only that copy
    .sort(([a], [b]) => asLaneKeyOrder({ a, b }))
    .map(([, lane]) => lane);

/**
 * .what = the order of two lane keys, by code unit
 * .why = names the sort, so the reader states its order by name rather than by a
 *        closure to decode (rule.require.named-transformers)
 * .note = code-unit order via compareStrings, never localeCompare: a locale's
 *         collation is host state, so it could order one set of lanes two ways
 */
const asLaneKeyOrder = (input: { a: string; b: string }): number =>
  compareStrings(input.a, input.b);

/**
 * .what = per lane, and in total, whether the warmer paid for itself
 *
 * .why = a warmer bills a real provider on a timer to keep a lane's prompt
 *        cache warm, and its whole claim is that the next review of that lane
 *        reads its prefix from cache — so its value is a subtraction: what the
 *        in-reach reviews' cache saved, less what the pokes cost. both figures are
 *        measured, by the warmer's ledger and each follower's own bill
 *        (`getOneCacheSavedPrice`).
 *
 *        it lives here, ancestor of `meter/` and `grove/`, because both folds
 *        owe the identical figure — one operation read by both breadths keeps
 *        them equal (rule.require.single-source-of-truth-for-render)
 *
 * .note = `now` is the clock a lapse is measured against. it is an input, never read
 *         here, so a test pins it and the contract passes the wall clock at its edge
 *         (rule.forbid.time-assumptions)
 *
 * .note = the amount saved is an upper bound on what the warmer bought — a
 *         review inside the cache ttl would have hit with no poke at all, so
 *         a `loss` is certain but a positive net is only `maybe`. a warmed run
 *         whose benefit is unweighed stays out of the net, and its cost renders on
 *         its own row (`costAwaited`) — see `WarmerValueVerdict`
 */
export const getOneWarmerValue = (input: {
  runs: ReviewRunMeter[];
  now: Date;
}): { lanes: WarmerValue[]; total: WarmerValue | null } => {
  // pair each warmed run with the reviews its warmth could have served
  const pairs = asWarmerPairs({ runs: input.runs, now: input.now });

  // only a corpus with a warmer has a value to state
  if (pairs.length === 0) return { lanes: [], total: null };

  // one row per lane, and the corpus total by the same arithmetic
  return {
    lanes: asWarmerLaneValues({ pairs }),
    total: asWarmerValue({ key: 'total', lane: null, pairs }),
  };
};
