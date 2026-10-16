import { asErrorHeadline } from '@src/domain.operations/review/asErrorHeadline';
import { isReviewLanePrefixSuperseded } from '@src/domain.operations/review/isReviewLanePrefixSuperseded';
import { isErrorOfWatermarkFault } from '@src/domain.operations/review/watermark/isErrorOfWatermarkFault';

import type { ReviewWarmerPlan } from './asReviewWarmerPlan';
import { asWarmerPlanDense } from './asWarmerPlanDense';
import { getOneInstantAfter } from './getOneInstantAfter';
import { getOneReviewWarmerRecord } from './getOneReviewWarmerRecord';
import { getOneWarmerReplay } from './getOneWarmerReplay';
import { isReviewWarmerRecordAlive } from './isReviewWarmerRecordAlive';
import type {
  ReviewWarmerPrefix,
  ReviewWarmerRecord,
} from './ReviewWarmerRecord';
import { setReviewWarmerLane } from './setReviewWarmerLane';
import { setReviewWarmerProcess } from './setReviewWarmerProcess';
import { setReviewWarmerRecord } from './setReviewWarmerRecord';
import { CLOCK_OF_WALL, type WarmerClock } from './WarmerClock';

/**
 * .what = what a spawn attempt decided, and why
 * .why = the caller must be able to say which of the three happened. a spawn
 *        that silently no-ops where a warmer already runs is indistinguishable
 *        from one that silently failed, and only one of those is fine.
 */
export type ReviewWarmerSpawn =
  | {
      act: 'spawned';
      pid: number;
      why: string;
      /** the prefix the warmer keeps warm — the key of the record that holds its pid */
      prefix: ReviewWarmerPrefix;
    }
  | {
      act: 'found';
      /** the prefix the warmer keeps warm — the key of the record that holds its pid */
      prefix: ReviewWarmerPrefix;
      /**
       * the live warmer's pid — `null` where it has not yet beat its first wake.
       *
       * nullable rather than `0`: a `?? 0` here is an unknown rendered as a
       * fact, and the fact it manufactures is executable. the render states
       * `stop: kill <pid>`, and `kill 0` signals the caller's entire process
       * group (rule.require.safe-by-default)
       */
      pid: number | null;
      why: string;
      /**
       * the plan the live warmer holds, as its record states it.
       *
       * carried rather than folded into `why` because the render must part a
       * live plan that matches what this round asked from one that differs
       * (`0.wish` bar 11)
       */
      live: ReviewWarmerPlan;
      /** what this round asked for — the half a findsert silently discards */
      asked: ReviewWarmerPlan;
    }
  | {
      act: 'refused';
      why: string;
      /**
       * whether the refusal is a fault of the system — a spawn or a watermark that
       * failed — rather than a request this run cannot serve. a fault renders
       * under its class, so a driver can tell who must act
       * (rule.require.qualified-error-headers)
       */
      malfunction: boolean;
    };

/**
 * .what = the minutes a fresh spawn has to beat its first wake before it reads dead
 * .why = a child that dies on import never beats, so its record must lapse soon — never
 *        a whole cadence later — or the next round would defer to a warmer that is gone.
 *        a healthy child boots in seconds and beats a full cadence out at once
 */
export const MINUTES_OF_WARMER_BOOT = 1;

/**
 * .what = findserts one live warmer for one reviewer's prefix — finds a live one, or
 *         spawns
 * .why = a guard re-drives a lane many times per route, and each round would otherwise
 *        spawn another warmer for the same reviewer. they never conflict — they simply
 *        all bill, so spend grows with rounds while coverage does not
 *        (rule.require.idempotent-operations, `0.wish` bar 14).
 *
 * .note = 🔴 no lock spans a warmer's life. the round records its prefix as the lane's
 *         current one, then — under a short hold on that prefix's record — finds a live
 *         warmer, or writes a fresh record and spawns. correctness does not rest on the
 *         dedupe: a duplicate warmer that slips past it costs a watermark check at each
 *         wake, never a poke, since every poke is claimed on the prefix's watermark
 *         (`setReviewWarmerPokeClaim`, rule.require.locks-via-with-simple-mutex)
 *
 * .note = a warmer of the lane's PRIOR prefix is never signaled from here. it reads at
 *         its next wake that the lane moved on, and exits (`setReviewWarmerWake`)
 *
 * .note = 🔴 a watermark fault never fails the review: it returns as a refusal, so a
 *         verdict already on disk keeps its exit
 *
 * .note = the child outlives this call — `setReviewWarmerProcess` detaches it, and
 *         states why
 */
export const genReviewWarmer = async (
  input: {
    cwd: string;
    reviewer: string;
    plan: ReviewWarmerPlan;
    /** the run whose prompt artifacts the warmer replays */
    logDir: string;
    /**
     * the brain the review ran on.
     *
     * a poke to a different brain warms a cache the next round can never read, so it
     * is passed through rather than defaulted (`asReviewLane`'s note)
     */
    brain: string;
    /**
     * the content digest of this run's prompt head (`getOneReviewRunHead`).
     *
     * with the brain it names the prefix this lane now sends — the key of the warmer's
     * watermark, and the value every older warmer of the lane compares against
     */
    head: string | null;
  },
  /** the clock the spawn instant and every record stamp read — the wall, unless a test drives it */
  context: { clock: WarmerClock } = { clock: CLOCK_OF_WALL },
): Promise<ReviewWarmerSpawn> => {
  const prefix: ReviewWarmerPrefix = { head: input.head, brain: input.brain };
  try {
    return await genReviewWarmerOfPrefix({ ...input, prefix }, context);
  } catch (error) {
    // a watermark the store refuses is the warmer's fault, never the review's
    if (!isErrorOfWatermarkFault({ error })) throw error;
    return {
      act: 'refused',
      malfunction: true,
      why: `the warmer watermark could not be read or written (${asErrorHeadline({ error })}) — the review stands; this lane goes unwarmed`,
    };
  }
};

/**
 * .what = the findsert itself, with watermark faults left to the caller to class
 */
const genReviewWarmerOfPrefix = async (
  input: {
    cwd: string;
    reviewer: string;
    plan: ReviewWarmerPlan;
    logDir: string;
    prefix: ReviewWarmerPrefix;
  },
  context: { clock: WarmerClock },
): Promise<ReviewWarmerSpawn> => {
  const now = context.clock.now();

  // record this prefix as the lane's current one; any warmer of the prior one reads
  // that at its next wake and exits
  const { prior } = await setReviewWarmerLane({
    cwd: input.cwd,
    reviewer: input.reviewer,
    lane: input.prefix,
  });
  const isPriorWarmerAwake =
    prior !== null &&
    isReviewLanePrefixSuperseded({ asked: input.prefix, live: prior }) &&
    isReviewWarmerRecordAlive({
      record: await getOneReviewWarmerRecord({
        cwd: input.cwd,
        reviewer: input.reviewer,
        prefix: prior,
      }),
      now,
    });

  // find a live warmer of this prefix, or write the record a fresh spawn will beat
  const found = await setReviewWarmerRecord<ReviewWarmerRecord | null>({
    cwd: input.cwd,
    reviewer: input.reviewer,
    prefix: input.prefix,
    transit: (record) =>
      isReviewWarmerRecordAlive({ record, now })
        ? { next: null, result: record }
        : {
            next: {
              plan: input.plan,
              pid: null,
              spawnedAt: now.toISOString(),
              wakeBy: getOneInstantAfter({
                since: now,
                minutes: MINUTES_OF_WARMER_BOOT,
              }).toISOString(),
              // a respawn keeps the prefix's last poke, so the new warmer honors it
              pokedAt: record?.pokedAt ?? null,
              endedAt: null,
            },
            result: null,
          },
  });
  if (found !== null)
    return {
      act: 'found',
      prefix: input.prefix,
      pid: found.pid,
      why: asWarmerPlanDense(found.plan),
      live: found.plan,
      asked: input.plan,
    };

  // from here this round wrote a fresh record, so every exit that is not a spawn
  // must end it — a record left to promise a wake would defer the next round to a
  // warmer that never ran
  const setRecordEnded = (): Promise<void> =>
    setReviewWarmerRecord({
      cwd: input.cwd,
      reviewer: input.reviewer,
      prefix: input.prefix,
      transit: (record) => ({
        next:
          record === null || record.pid !== null
            ? null
            : { ...record, endedAt: context.clock.now().toISOString() },
        result: undefined,
      }),
    });

  // the artifacts a poke replays must be on disk before the child looks for them
  const replay = getOneWarmerReplay({ logDir: input.logDir });
  if (!replay.replayable) {
    await setRecordEnded();
    return {
      act: 'refused',
      malfunction: true,
      // the review itself is unharmed, and the clause says so, then names the
      // next move (rule.require.errors-name-the-fix)
      why: `no prompt head at ${replay.pathOfHead} — a warmer cannot replay a prompt it cannot read; the review ran unwarmed — re-run to retry, or inspect ${input.logDir}`,
    };
  }

  // start the detached child; one with no pid never started — report it
  const child = setReviewWarmerProcess({
    cwd: input.cwd,
    reviewer: input.reviewer,
    plan: input.plan,
    logDir: input.logDir,
    brain: input.prefix.brain,
  });
  if (child.pid === null) {
    await setRecordEnded();
    return {
      act: 'refused',
      malfunction: true,
      why: 'the warmer process yielded no pid',
    };
  }

  return {
    act: 'spawned',
    prefix: input.prefix,
    pid: child.pid,
    why: isPriorWarmerAwake
      ? `${asWarmerPlanDense(input.plan)}; the warmer of the prior prompt head retires at its next wake`
      : asWarmerPlanDense(input.plan),
  };
};
