import { emitReviewRefusal } from '@src/domain.operations/emitReviewRefusal';
import { MARK_OF_ABSENT } from '@src/domain.operations/review/meter/asFigureHuman';
import { isErrorOfWatermarkFault } from '@src/domain.operations/review/watermark/isErrorOfWatermarkFault';

import { asWarmerStopLine } from './asWarmerStopLine';
import { getOneReviewWarmerLive } from './getOneReviewWarmerLive';
import { CLOCK_OF_WALL, type WarmerClock } from './WarmerClock';

/**
 * .what = names a warmer that is still alive after a driver asked for `--warmer off`
 * .why = `--warmer off` stops the spawn, not a warmer a prior round already
 *        spawned — that process is detached, holds its own plan, and pokes on its
 *        own clock until its budget is spent. without this line, a driver who
 *        runs `--warmer off` gets a review that spends naught new and a spender
 *        that bills on regardless, with no word that their flag left it unchanged
 *        — so they believe the spend stopped (rule.forbid.failhide). this line is
 *        what makes the spender stoppable, since the pid was printed rounds ago
 *        and scrolled away.
 *
 * .note = it names the warmer and never kills it. to reap another round's process
 *         on the strength of this round's flag would end a spender the driver may
 *         still want — `off` asks for no spawn, never a reap. the kill stays the
 *         driver's act, so the command is spelled out
 *         (rule.require.errors-name-the-fix, rule.require.safe-by-default).
 *
 * .note = silent where no warmer is alive. a driver who passes `off` asked for
 *         quiet, and a line on every `off` round is a line they learn to skip —
 *         so it goes unread on the one round it fires for real.
 *
 * .note = liveness is the warmer's own beat on its watermark, never a pid probe — a
 *         warmer that crashed stops to beat, and reads dead within one cadence
 *
 * .note = a watermark the store refuses leaves this line unsaid: it is an aside, and
 *         a review whose verdict is written must not fail on it
 *
 * .note = it prints to stderr, beside `emitReviewWarmerSpawn`, since `rhx
 *         review`'s stdout is parsed by the route guard for a numeric verdict
 *         (contract.reviewer-output), and a warmer aside belongs on the stream a
 *         parser never reads.
 */
export const emitReviewWarmerDisowned = async (
  input: {
    cwd: string;
    reviewer: string;
  },
  /** the clock the liveness check reads — the wall, unless a test drives it */
  context: { clock: WarmerClock } = { clock: CLOCK_OF_WALL },
): Promise<void> => {
  const live = await getOneReviewWarmerLive({
    ...input,
    now: context.clock.now(),
  }).catch((error: unknown) => {
    if (!isErrorOfWatermarkFault({ error })) throw error;
    return null;
  });
  if (live === null) return;

  // the paved `warn` frame, never `ConstraintError`: the review succeeded and the flag
  // took, so an error class here reads as a refusal where the run went on
  // (rule.require.qualified-error-headers, emitReviewRefusal's `warn` row)
  emitReviewRefusal({
    kind: 'warn',
    headline: 'warmer: off — and a warmer from an earlier round is STILL awake',
    lines: [
      `   ├─ reviewer: ${input.reviewer}`,
      `   ├─ pid: ${live.record.pid ?? `${MARK_OF_ABSENT} (not yet recorded)`}`,
      `   ├─ --warmer off stops the next spawn, never a live warmer`,
      asWarmerStopLine({
        pid: live.record.pid,
        reviewer: input.reviewer,
        prefix: live.prefix,
        form: 'tree',
        // the driver just passed `--warmer off`; to offer it again reads as
        // though the flag did not take
        levers: 'stop',
      }),
    ],
  });
};
