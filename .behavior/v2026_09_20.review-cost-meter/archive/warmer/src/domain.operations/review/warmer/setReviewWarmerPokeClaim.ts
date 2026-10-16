import type { ReviewWarmerPlan } from './asReviewWarmerPlan';
import { getOneInstantAfter } from './getOneInstantAfter';
import { getOneMinutesElapsed } from './getOneMinutesElapsed';
import type { ReviewWarmerPrefix } from './ReviewWarmerRecord';
import { setReviewWarmerRecord } from './setReviewWarmerRecord';

/**
 * .what = whether this warmer may poke its prefix now
 *
 * - `granted` = no warmer poked this prefix within the cadence; this one now owns the poke
 * - `denied`  = a peer warmer poked it at `pokedAt`, within the cadence; this one defers
 */
export type ReviewWarmerPokeClaim =
  | { act: 'granted' }
  | { act: 'denied'; pokedAt: Date };

/**
 * .what = claims the next poke of one prefix — checks its last-poked-at watermark and,
 *         where no peer poked within the cadence, writes this poke's instant
 * .why = two warmers of one prefix — a duplicate spawn, a respawn beside a live one —
 *        would otherwise each poke on their own clock and each bill in full, for one
 *        cache. the check and the write share one short hold, so of two warmers that
 *        wake together exactly one is granted; the other defers. a duplicate costs a
 *        check, never a poke (rule.require.locks-via-with-simple-mutex)
 *
 * .note = the poke itself runs AFTER this returns, outside the hold. a poke that then
 *         faults still holds its window: it may have billed, and a peer that pokes at
 *         once would repeat the spend against the provider that just failed
 * .note = a prefix with no record yet is granted and a record is written, so the very
 *         first poke is already visible to a peer
 */
export const setReviewWarmerPokeClaim = async (input: {
  cwd: string;
  reviewer: string;
  prefix: ReviewWarmerPrefix;
  plan: ReviewWarmerPlan;
  now: Date;
}): Promise<ReviewWarmerPokeClaim> =>
  setReviewWarmerRecord<ReviewWarmerPokeClaim>({
    cwd: input.cwd,
    reviewer: input.reviewer,
    prefix: input.prefix,
    transit: (found) => {
      // a peer poked within the cadence: this warmer defers, and writes naught
      const pokedAt = found?.pokedAt ? new Date(found.pokedAt) : null;
      if (
        pokedAt !== null &&
        getOneMinutesElapsed({ since: pokedAt, until: input.now }) <
          input.plan.everyMinutes
      )
        return { next: null, result: { act: 'denied', pokedAt } };

      // no peer poked within the cadence: this warmer takes the poke, and beats a
      // full cadence out, since that is when it wakes next
      const nowStamp = input.now.toISOString();
      const wakeBy = getOneInstantAfter({
        since: input.now,
        minutes: input.plan.everyMinutes,
      }).toISOString();
      return {
        next: {
          plan: found?.plan ?? input.plan,
          pid: found?.pid ?? null,
          spawnedAt: found?.spawnedAt ?? nowStamp,
          wakeBy,
          pokedAt: nowStamp,
          endedAt: null,
        },
        result: { act: 'granted' },
      };
    },
  });
