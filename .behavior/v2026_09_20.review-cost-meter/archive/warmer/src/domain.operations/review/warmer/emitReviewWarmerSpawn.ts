import { emitReviewRefusal } from '@src/domain.operations/emitReviewRefusal';
import { MARK_OF_ABSENT } from '@src/domain.operations/review/meter/asFigureHuman';

import { asReviewWarmerDir } from './asReviewWarmerDir';
import type { ReviewWarmerPlan } from './asReviewWarmerPlan';
import { asWarmerBoundLines } from './asWarmerBoundLines';
import { asWarmerPlanDense } from './asWarmerPlanDense';
import { asWarmerStopLine } from './asWarmerStopLine';
import type { ReviewWarmerSpawn } from './genReviewWarmer';
import { isWarmerPlanMatch } from './isWarmerPlanMatch';

/**
 * .what = states, in one tree, what became of a warmer spawn
 * .why = 1.vision.experience.case=7 forbids an engine act with no record. a warmer
 *        spends real money on a detached process a driver never asked for by
 *        name, so the one moment they can learn it exists is the stdout of the
 *        review that spawned it. the three verdicts each print — a `found` that
 *        stayed silent would read exactly like a `spawned` that stayed silent,
 *        and only one of the two means a new spender is alive.
 *
 * .note = it prints to stderr, on every branch, because `rhx review`'s stdout is
 *         a machine-parsed surface: the route guard reads it for a numeric
 *         blocker and nitpick count (contract.reviewer-output), and an unreadable
 *         count is a malfunction that blocks the stone. what belongs on stdout
 *         is the verdict; a warmer announcement is an aside to the human beside
 *         it, and stderr goes to the driver's terminal without touching a
 *         parser.
 *
 * .note = the `found` branch collapses to one line, where `spawned` and a plan
 *         mismatch stay in full. the three outcomes differ in what a driver must
 *         do about them: a `found` is a no-op (a warmer they were already told
 *         about is still alive), where a `spawned` is a new spender and a
 *         mismatch is a plan silently discarded. a no-op that costs seven lines
 *         of attention trains a driver to skip the block that carries the other
 *         two.
 */
export const emitReviewWarmerSpawn = (input: {
  reviewer: string;
  spawn: ReviewWarmerSpawn;
}): void => {
  const { spawn } = input;

  if (spawn.act === 'refused') {
    // a fault is the system's, so it opens under its class (F72 keys the class on
    // who must act)
    if (spawn.malfunction) {
      emitReviewRefusal({
        kind: 'malfunction',
        headline: `warmer: none — ${spawn.why}`,
        lines: [],
      });
      return;
    }

    // a request this run cannot serve halts naught: the review ran and its verdict
    // stands, so the notice takes the paved `warn` frame and never `ConstraintError`,
    // which means the run halted (rule.require.qualified-error-headers)
    emitReviewRefusal({
      kind: 'warn',
      headline: `warmer: none — ${spawn.why}`,
      lines: [],
    });
    return;
  }

  const verb = spawn.act === 'spawned' ? 'awake' : 'already awake';

  // collapse a found warmer whose live plan is the one this round asked for
  const planMatched = asWarmerPlanFoundAndMatched({ spawn });
  if (planMatched !== null) {
    console.error(
      `\n🦉 warmer: ${verb} — ${input.reviewer}, ${asWarmerPlanDense(planMatched)}` +
        asWarmerStopLine({
          pid: spawn.pid,
          reviewer: input.reviewer,
          prefix: spawn.prefix,
          form: 'aside',
          levers: 'stop-and-never-spawn',
        }),
    );
    return;
  }

  console.error(
    [
      `\n🦉 warmer: ${verb} — ${spawn.why}`,
      `   ├─ reviewer: ${input.reviewer}`,
      ...asWarmerBoundLines({ spawn }),
      // an unknown pid renders absent, never `0` — a `pid: 0` row would read as
      // a fact a driver may act on, and it is the one number that must not be
      `   ├─ pid: ${spawn.pid ?? `${MARK_OF_ABSENT} (not yet recorded)`}`,
      `   ├─ logs: ${asReviewWarmerDir({ cwd: '.', reviewer: input.reviewer })}`,
      // the two next moves, stated rather than left to be found: a driver did
      // not ask for this process by name, so this is the only place they can
      // learn how to end it (rule.require.discoverability, rule.require.safe-by-default)
      asWarmerStopLine({
        pid: spawn.pid,
        reviewer: input.reviewer,
        prefix: spawn.prefix,
        form: 'tree',
        levers: 'stop-and-never-spawn',
      }),
    ].join('\n'),
  );
};

/**
 * .what = the live plan of a FOUND warmer, when it is the plan this round asked for
 * .why = the one decision that collapses the spawn record to a single line, named
 *        so the emitter branches on it rather than on a three-clause boolean
 *
 * .note = a mismatch yields null — the asked plan was silently discarded, which is
 *         news, so it keeps the full tree. a `spawned` yields null too, since a
 *         new spender is news.
 */
const asWarmerPlanFoundAndMatched = (input: {
  spawn: ReviewWarmerSpawn;
}): ReviewWarmerPlan | null => {
  if (input.spawn.act !== 'found') return null;
  if (!isWarmerPlanMatch({ live: input.spawn.live, asked: input.spawn.asked }))
    return null;
  return input.spawn.live;
};
