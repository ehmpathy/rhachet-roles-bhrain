import type { ReviewWarmerPlan } from './asReviewWarmerPlan';
import { getOneInstantAfter } from './getOneInstantAfter';
import type { ReviewWarmerPrefix } from './ReviewWarmerRecord';
import { setReviewWarmerRecord } from './setReviewWarmerRecord';

/**
 * .what = a warmer's first beat: it records its own pid, and promises its first wake
 *         a cadence out
 * .why = the round that spawned it wrote a record with no pid and a short boot window.
 *        the child is the one party that knows its pid for certain, so it writes it —
 *        no handoff from parent to child, and no hold that outlives this one write
 *        (rule.require.locks-via-with-simple-mutex)
 *
 * .note = the last warmer to boot names the record's pid. a duplicate that boots beside
 *         a live warmer takes the name, and the warmer it displaced reads that at its
 *         next wake and exits (`setReviewWarmerWake`), so the pid a round prints is the
 *         one warmer that still pokes
 */
export const setReviewWarmerBoot = async (input: {
  cwd: string;
  reviewer: string;
  prefix: ReviewWarmerPrefix;
  plan: ReviewWarmerPlan;
  pid: number;
  now: Date;
}): Promise<void> =>
  setReviewWarmerRecord({
    cwd: input.cwd,
    reviewer: input.reviewer,
    prefix: input.prefix,
    transit: (found) => ({
      next: {
        plan: found?.plan ?? input.plan,
        pid: input.pid,
        spawnedAt: found?.spawnedAt ?? input.now.toISOString(),
        wakeBy: getOneInstantAfter({
          since: input.now,
          minutes: input.plan.everyMinutes,
        }).toISOString(),
        pokedAt: found?.pokedAt ?? null,
        endedAt: null,
      },
      result: undefined,
    }),
  });
