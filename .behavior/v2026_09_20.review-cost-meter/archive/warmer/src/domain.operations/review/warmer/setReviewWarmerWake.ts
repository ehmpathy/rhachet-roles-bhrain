import { isReviewLanePrefixSuperseded } from '@src/domain.operations/review/isReviewLanePrefixSuperseded';

import type { ReviewWarmerPlan } from './asReviewWarmerPlan';
import { getOneInstantAfter } from './getOneInstantAfter';
import { getOneReviewWarmerLane } from './getOneReviewWarmerLane';
import { isReviewWarmerRecordOfAnotherPid } from './isReviewWarmerRecordOfAnotherPid';
import type { ReviewWarmerPrefix } from './ReviewWarmerRecord';
import { setReviewWarmerRecord } from './setReviewWarmerRecord';

/**
 * .what = what a warmer learns at one wake: whether its prefix is still the lane's,
 *         whether the record still names it, and when any warmer of that prefix last
 *         poked it
 */
export interface ReviewWarmerWake {
  /** the lane now sends another prefix, so this warmer's work is no longer wanted */
  superseded: boolean;
  /** the record names another warmer's pid, so no printed `kill` reaches this one */
  displaced: boolean;
  /** the last poke of this prefix by any warmer, or null where none has poked */
  pokedAt: Date | null;
}

/**
 * .what = one warmer's wake: read whether its prefix is still current and still its own,
 *         beat its next wake into the record, and read the prefix's last poke
 * .why = a warmer keeps no lock across its life. what keeps it honest is STATE it reads
 *        at each wake (rule.require.locks-via-with-simple-mutex):
 *        - a newer round recorded another prefix for the lane → this warmer exits
 *        - a duplicate booted beside it and took the record's pid → this warmer exits,
 *          so the one pid a round prints is the one warmer that still pokes
 *        - a peer warmer poked this prefix within the cadence → this warmer defers
 *        and what tells a round this warmer is alive is the beat it writes here
 *
 * .note = the beat promises the next wake no later than one full cadence out — a defer
 *         wakes sooner, and a poke wakes exactly a cadence out — so the bound holds on
 *         every path the loop takes
 * .note = a superseded or displaced warmer writes no beat: it is about to exit, and its
 *         beat would read the record alive for one more cadence on its behalf. a
 *         displaced warmer's peer beats for itself
 * .note = the displacement check rides the same transition as the beat, so no boot can
 *         land between the read of the pid and the write of the wake
 */
export const setReviewWarmerWake = async (input: {
  cwd: string;
  reviewer: string;
  prefix: ReviewWarmerPrefix;
  plan: ReviewWarmerPlan;
  /** this warmer's own pid — the name the record must still hold for it to poke */
  pid: number;
  now: Date;
}): Promise<ReviewWarmerWake> => {
  // the lane's current prefix, as its latest round recorded it
  const lane = await getOneReviewWarmerLane(input);
  const superseded =
    lane !== null &&
    isReviewLanePrefixSuperseded({ asked: lane, live: input.prefix });
  if (superseded) return { superseded, displaced: false, pokedAt: null };

  // check the name, beat the next wake, and read the last poke, in one transition
  const wakeBy = getOneInstantAfter({
    since: input.now,
    minutes: input.plan.everyMinutes,
  }).toISOString();
  const found = await setReviewWarmerRecord({
    cwd: input.cwd,
    reviewer: input.reviewer,
    prefix: input.prefix,
    transit: (record) => {
      // another warmer holds the name: write naught, and report it
      if (isReviewWarmerRecordOfAnotherPid({ record, pid: input.pid }))
        return { next: null, result: { displaced: true, pokedAt: null } };
      return {
        next: record
          ? { ...record, wakeBy, endedAt: null }
          : {
              plan: input.plan,
              pid: null,
              spawnedAt: input.now.toISOString(),
              wakeBy,
              pokedAt: null,
              endedAt: null,
            },
        result: { displaced: false, pokedAt: record?.pokedAt ?? null },
      };
    },
  });
  return {
    superseded: false,
    displaced: found.displaced,
    pokedAt: found.pokedAt === null ? null : new Date(found.pokedAt),
  };
};
