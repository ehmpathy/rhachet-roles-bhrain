import * as path from 'path';

import type { ReviewRunMeter } from '@src/domain.objects/Reviewer/ReviewRunMeter';
import { asLogDirMintedAt } from '@src/domain.operations/review/asLogDirMintedAt';
import { asReviewLane } from '@src/domain.operations/review/asReviewLane';
import { asReviewLaneKey } from '@src/domain.operations/review/asReviewLaneKey';
import { asRunDirChronologicalOrder } from '@src/domain.operations/review/asRunDirChronologicalOrder';
import { MINUTES_OF_CACHE_REACH } from '@src/domain.operations/review/MINUTES_OF_CACHE_REACH';
import { getOneMinutesElapsed } from '@src/domain.operations/review/meter/getOneMinutesElapsed';
import { SLUG_OF_ABSENT_IDENTITY } from '@src/domain.operations/review/SLUG_OF_ABSENT_IDENTITY';

/**
 * .what = the key of the lane a run is charged to — its `asReviewLane`, or the one
 *         visible bucket a run with no guard identity falls in, within its log root
 * .why = the ordinal counts repeats OF A LANE, so it reads the one lane definition
 *        every other lane fold reads — never a second
 *
 * .note = every identity-less run of one root shares one bucket, so a corpus of hand
 *         runs reads as one lane run N times — the honest read, since they share a
 *         system prompt only by accident, and the grade they earn (`warm`) is the
 *         conservative one.
 */
const asLaneKey = (input: { run: ReviewRunMeter }): string =>
  asReviewLaneKey({
    lane: asReviewLane({ run: input.run }) ?? {
      root: path.dirname(input.run.dir),
      slug: SLUG_OF_ABSENT_IDENTITY,
      head: null,
      brain: null,
    },
  });

/**
 * .what = where one run sits within its lane — its ordinal, and whether its lane's
 *         prior warmth lapsed just before it
 * .why = an ordinal of 1 has two causes that want opposite responses. a lane's first
 *        round had no prior prompt to share a prefix with — correct, no act owed. a
 *        lane whose prior warmth aged past the cache reach HAD a prefix and lost it —
 *        a real loss, a pause between rounds longer than the cache holds. so the
 *        ordinal alone cannot tell a driver whether a cold round is the weather or a
 *        loss they can stop
 */
export interface LaneOrdinal {
  /** the 1-based count of brain runs of this lane still within the cache reach */
  ordinal: number;
  /**
   * the minutes since the lane last held its prefix warm, where that gap passed the
   * cache reach and so reset the ordinal to 1 — null where no prior warmth existed
   * (a true first round) or where the prior warmth still held
   */
  lapsedMinutes: number | null;
}

/**
 * .what = the 1-based ordinal of each run WITHIN ITS LANE, keyed by run dir
 * .why = the quantity that parts a cold `0.0%` from a defective one. a prompt
 *        cache is warmed by a prior request that shared its prefix, so a lane's
 *        first run cannot hit one however perfect its layout is — the meter
 *        rendered that first run and a sixth consecutive miss identically,
 *        the same absence-reads-as-a-fact defect `getOneAccountedCost` refuses
 *        for spend and `getOneAttributionGrade` refuses for composition
 *        (rule.forbid.failhide).
 *
 * .note = the ordinal counts only the prior runs that could have left a warm prefix:
 *         a `refused` run died at validation and sent no brain request, and a prior
 *         run past the cache reach, measured from its mint, left a prefix that is
 *         gone. so a lane re-run the next day, or a round after a refusal, is a first
 *         run again. a round after a refusal is a fact about the world; a round after a
 *         lapse is a real loss, so the lapse rides beside the ordinal
 *         (`LaneOrdinal.lapsedMinutes`) and the two are never read as one
 *
 * .note = ordered by the log dir's basename, never `identity.iteration`. the
 *         basename opens with an iso timestamp (`genLogDirName`), so a
 *         lexicographic sort is chronological — and chronology is what a cache
 *         actually sees. `iteration` is absent for every hand run and not
 *         guaranteed unique within a lane, so it would silently mis-order the
 *         runs whose grade this decides.
 */
export const getAllLaneOrdinals = (input: {
  runs: ReviewRunMeter[];
}): Map<string, LaneOrdinal> => {
  const chronological = [...input.runs].sort((a, b) =>
    asRunDirChronologicalOrder({ a, b }),
  );

  // .note = deliberate mutation, in a scoped zone — the two maps are born here and
  //         neither escapes until `ordinalByDir` returns whole, so no observer can
  //         read a half-counted state (rule.require.immutable-vars).
  //
  //         the fold is sequentially dependent: each run's ordinal depends on how
  //         many of its lane came before it, so the counter must carry across
  //         iterations. a `reduce` would express the same dependence while it
  //         copies two maps per run; a `map` cannot express it at all — the
  //         ordinal is a property of the run's position within its lane, not of
  //         the run itself.
  const priorByLane = new Map<string, { count: number; lastAt: Date }>();
  const ordinalByDir = new Map<string, LaneOrdinal>();

  for (const run of chronological) {
    const lane = asLaneKey({ run });
    const at = asLogDirMintedAt({ name: path.basename(run.dir) });

    // the prior brain runs that could still hold a warm prefix for this one: none,
    // where the last of them is past the cache reach — and then the lapse is named,
    // since a prefix the lane once held and lost is not a first round
    const prior = priorByLane.get(lane) ?? null;
    const lapsed =
      prior !== null && isCacheReachPassed({ since: prior.lastAt, until: at });
    const count = prior === null || lapsed ? 0 : prior.count;
    ordinalByDir.set(run.dir, {
      ordinal: count + 1,
      lapsedMinutes:
        prior !== null && lapsed
          ? getOneMinutesElapsed({ since: prior.lastAt, until: at })
          : null,
    });

    // a refused run never reached the brain, so it warmed no cache for the next
    // .note = 🟡 an `unknown` run does count as one that warmed its lane, though it may
    //         never have reached the provider: a call that faulted before the provider
    //         ran and a call that succeeded and then failed to write its metrics leave
    //         the same disk state (a prompt, no realized record), so the meter cannot
    //         part them. the bias errs toward `warm`, the grade that never buys a zero
    //         an excuse — so the first run after a provider outage may read
    //         `🟡 warm and cached NAUGHT` for a prefix no request ever sent. a reader who
    //         sees that caveat beside an `unknown` prior should suspect the outage first
    if (run.grade === 'refused') continue;

    // the lane last held its prefix warm at this run's mint
    priorByLane.set(lane, { count: count + 1, lastAt: at });
  }

  return ordinalByDir;
};

/**
 * .what = whether the cache reach has passed between two run mints
 * .why = a prefix a lane last sent more than `MINUTES_OF_CACHE_REACH` ago is gone
 *
 * .note = a mint that does not parse reads as the epoch (`asLogDirMintedAt`). such a
 *         gap is unknown, never long, so it does NOT lapse: an unplaced run keeps the
 *         conservative `warm` grade rather than buy its zero an excuse
 */
const isCacheReachPassed = (input: { since: Date; until: Date }): boolean => {
  if (input.since.getTime() === 0 || input.until.getTime() === 0) return false;
  return (
    getOneMinutesElapsed({ since: input.since, until: input.until }) >=
    MINUTES_OF_CACHE_REACH
  );
};
