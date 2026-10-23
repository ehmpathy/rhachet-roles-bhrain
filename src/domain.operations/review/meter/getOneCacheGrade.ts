import type { ReviewRunMeter } from '@src/domain.objects/Reviewer/ReviewRunMeter';
import type { LaneOrdinal } from '@src/domain.operations/review/meter/getAllLaneOrdinals';
import { getAllRunsMetered } from '@src/domain.operations/review/meter/getAllRunsMetered';

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
  | { kind: 'warm' }
  | { kind: 'cold'; cause: 'first' }
  | { kind: 'cold'; cause: 'lapsed'; minutes: number };

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

  // one repeat within reach makes the whole bucket warm
  const anyRepeat = metered.some((run) =>
    isReviewerRepeat({ run, ordinals: input.ordinals }),
  );
  if (anyRepeat) return { kind: 'warm' };

  // cold: name the lapse where any run followed one, else it is a first round
  const lapses = metered
    .map((run) => input.ordinals.get(run.dir)?.lapsedMinutes ?? null)
    .filter((minutes): minutes is number => minutes !== null);
  if (lapses.length === 0) return { kind: 'cold', cause: 'first' };
  return { kind: 'cold', cause: 'lapsed', minutes: Math.max(...lapses) };
};

/**
 * .what = whether a run had a prior run of its lane within the cache reach (ordinal > 1)
 * .why = a run whose ordinal is unknown is treated as a repeat, for the same reason
 *        `warm` is the conservative grade: an unplaced run must not buy a zero an excuse
 */
const isReviewerRepeat = (input: {
  run: ReviewRunMeter;
  ordinals: Map<string, LaneOrdinal>;
}): boolean => {
  const placed = input.ordinals.get(input.run.dir);
  if (placed === undefined) return true;
  return placed.ordinal > 1;
};
