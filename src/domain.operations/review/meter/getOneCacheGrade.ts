import * as path from 'path';

import type { ReviewRunMeter } from '@src/domain.objects/Reviewer/ReviewRunMeter';
import type { LaneOrdinal } from '@src/domain.operations/review/meter/getAllLaneOrdinals';
import { getAllRunsMetered } from '@src/domain.operations/review/meter/getAllRunsMetered';
import { compareStrings } from '@src/utils/compareStrings';

/**
 * .what = whether a bucket's measured runs ever had a cache to hit — and, where
 *         none did, why not
 * .why = `0.0% cached` states three different things when rendered as one figure:
 *
 *        - a lane's first round cannot hit a cache — there was none to, so `0.0%`
 *          is a fact about the world and says naught about the prompt. no act owed
 *        - a lane whose prior warmth aged past the cache reach HAD a prefix and
 *          lost it — a real loss, which no prompt edit repairs; only a shorter
 *          pause between rounds does
 *        - a lane's sixth run at `0.0%` with its prefix still in reach is a
 *          defect — a cache existed, the prefix repeated, and the request did not
 *          reach it
 *
 *        the same law `getOneAccountedCost` holds for spend (`refused` vs
 *        `unknown`) and `getOneAttributionGrade` holds for composition
 *        (`attributed` vs `unattributed`): a nil that is a fact must never
 *        render like a nil that is a loss (rule.forbid.failhide).
 *
 * .note = `warm` is the conservative grade — a bucket is cold only when every
 *         measured run in it had no prior run of its lane within the cache reach
 *         (`getAllLaneOrdinals`); one repeat is enough to make the zero worth a
 *         reader's attention.
 *
 * .note = a cold bucket is `lapsed` where ANY of its measured runs followed a lapse,
 *         with the longest gap among them — the loss is the half a driver can act
 *         on, so it must not hide behind a peer run's first round.
 */
export type CacheGrade =
  /**
   * `via` names where the cache it had to hit came from: `prior` — a prior round of its
   * lane within reach; `meet` — only a peer that warmed its head this round. a zero
   * under each wants a different hunt: a prefix that broke between rounds, or a read
   * that met another replica than the poke's
   *
   * `dir` = the latest repeat run of the bucket, so a zero's hint names the one run whose
   * prefix pair (`--of run --at <dir>`) shows where the prefix broke. any repeat in a
   * zero bucket read naught, so the latest is the one a driver most likely just ran
   */
  | { kind: 'warm'; via: 'prior'; dir: string }
  | { kind: 'warm'; via: 'meet' }
  | { kind: 'cold'; cause: 'first' }
  | { kind: 'cold'; cause: 'lapsed'; minutes: number }
  /**
   * `poke` = every measured run is a prime's poke (`meet: 'poke'`). a poke writes the head
   * for its peers to read; it never had a read owed, so its zero is by design, never a miss
   */
  | { kind: 'cold'; cause: 'poke' };

/**
 * .what = grades a bucket's cache opportunity from its runs' lane ordinals
 * .why = one derivation, read by the report and rendered by one marker, so the
 *        grade and the rate it qualifies cannot part company
 *        (rule.require.single-source-of-truth-for-render)
 *
 * .note = graded over the metered runs alone, since the rate it qualifies is
 *         taken over the metered runs alone — so it answers `null` where no
 *         run is metered, in lockstep with `cacheHitRate`.
 */
export const getOneCacheGrade = (input: {
  runs: ReviewRunMeter[];
  ordinals: Map<string, LaneOrdinal>;
}): CacheGrade | null => {
  const metered = getAllRunsMetered({ runs: input.runs });
  if (metered.length === 0) return null;

  // a bucket of pokes alone wrote the head and owed no read, so its zero is by design
  if (metered.every((run) => run.meet === 'poke'))
    return { kind: 'cold', cause: 'poke' };

  // one repeat within reach, or one warm meet, makes the whole bucket warm. a meet
  // outranks a prior: a peer wrote THIS round's head seconds before, so a zero after it
  // is a read that met another replica, whatever the prior round sent — a broken prefix
  // between rounds cannot explain it
  const anyMetWarm = metered.some(
    (run) => input.ordinals.get(run.dir)?.metWarm === true,
  );
  if (anyMetWarm) return { kind: 'warm', via: 'meet' };
  const repeats = metered.filter((run) =>
    isReviewerRepeatOfPrior({ run, ordinals: input.ordinals }),
  );
  const repeatLatest = getOneRunLatest({ runs: repeats });
  if (repeatLatest)
    return { kind: 'warm', via: 'prior', dir: repeatLatest.dir };

  // cold: name the lapse where any run followed one, else it is a first round
  const lapses = metered
    .map((run) => input.ordinals.get(run.dir)?.lapsedMinutes ?? null)
    .filter((minutes): minutes is number => minutes !== null);
  if (lapses.length === 0) return { kind: 'cold', cause: 'first' };
  return { kind: 'cold', cause: 'lapsed', minutes: Math.max(...lapses) };
};

/**
 * .what = the run minted last, or null where there is none
 * .why = a run dir's name leads with its iso mint stamp, so its basename sorts by time
 */
const getOneRunLatest = (input: {
  runs: ReviewRunMeter[];
}): ReviewRunMeter | null =>
  [...input.runs].sort((a, b) =>
    // a locale-free order, so the latest run is the same one on every host
    compareStrings(path.basename(b.dir), path.basename(a.dir)),
  )[0] ?? null;

/**
 * .what = whether a run had a prior round of its lane within the cache reach (ordinal > 1)
 * .why = a run whose ordinal is unknown is treated as a repeat, for the same reason
 *        `warm` is the conservative grade: an unplaced run must not buy a zero an excuse
 *
 * .note = a warm-met run is warm too, by the second test above, for the same reason its
 *         prefix pair grades `missed`: the head was in cache, so a zero is a miss
 */
const isReviewerRepeatOfPrior = (input: {
  run: ReviewRunMeter;
  ordinals: Map<string, LaneOrdinal>;
}): boolean => {
  const placed = input.ordinals.get(input.run.dir);
  if (placed === undefined) return true;
  return placed.ordinal > 1;
};
