import { emitReviewRefusal } from '@src/domain.operations/emitReviewRefusal';
import { asCountedNoun } from '@src/utils/asCountedNoun';

import { asWarmerStopLine } from './asWarmerStopLine';
import { getAllReviewWarmersLive } from './getAllReviewWarmersLive';
import { MINUTES_OF_WARMER_GRACE } from './isReviewWarmerRecordAlive';
import { CLOCK_OF_WALL, type WarmerClock } from './WarmerClock';

/**
 * .what = names each warmer still awake among a tree's lanes, with the stop for each
 * .why = the "stop it" half of a warmer's life. its pid printed on the round that spawned
 *        it; a driver who reads `rhx review._.cost --of tree` after that output scrolled
 *        away is told which lanes still spend, and how to end each — read from the
 *        watermarks, never a paid review re-run (rule.require.status-feedback,
 *        rule.require.errors-name-the-fix)
 *
 * .note = silent where none is awake, so the line fires only when a lane still spends
 * .note = it names and never kills: the kill stays the driver's act, so it is spelled out
 *         (rule.require.safe-by-default). an unknown pid gets no kill — `asWarmerStopLine`
 *         names the record the pid will land in instead
 * .note = stderr, through the paved `warn` frame, so a `--json` document on stdout stays
 *         parseable and the report's own shape is unchanged
 */
export const emitReviewWarmersAwake = async (
  input: {
    cwd: string;
    reviewers: string[];
  },
  /** the clock the liveness check reads — the wall, unless a test drives it */
  context: { clock: WarmerClock } = { clock: CLOCK_OF_WALL },
): Promise<void> => {
  const awake = await getAllReviewWarmersLive({
    ...input,
    now: context.clock.now(),
  });
  if (awake.length === 0) return;

  emitReviewRefusal({
    kind: 'warn',
    headline: `${asCountedNoun({ count: awake.length, one: 'warmer', many: 'warmers' })} still awake in this tree — each pokes until its plan is spent`,
    lines: [
      ...awake.map(
        (warmer) =>
          `   ├─ ${warmer.reviewer}${asWarmerStopLine({
            pid: warmer.record.pid,
            reviewer: warmer.reviewer,
            prefix: warmer.prefix,
            form: 'aside',
            levers: 'stop',
          })}`,
      ),
      // the pid is read from the warmer's own record, never probed (a recycled pid fools a
      // probe — `isReviewWarmerRecordAlive`). so a warmer that crashed reads awake until its
      // promised wake lapses, and the kill above could name a pid the os has reused
      `   └─ each pid is read from its warmer's record — a warmer that crashed reads awake until its next wake (≤ one cadence + ${MINUTES_OF_WARMER_GRACE}m), so confirm with \`ps -p <pid>\` before you kill`,
    ],
  });
};
