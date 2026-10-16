import { asReviewWarmerRecordPath } from './asReviewWarmerRecordPath';
import { asWarmerKillCommand } from './asWarmerKillCommand';
import { MINUTES_OF_WARMER_BOOT } from './genReviewWarmer';
import type { ReviewWarmerPrefix } from './ReviewWarmerRecord';

/**
 * .what = how to stop a warmer, or where its pid will appear
 * .why = a `found` pid can be unknown — the warmer's record is fresh, but its child has
 *        not yet beat its first wake. `0` is what a `??` default would produce, and
 *        `kill 0` signals the caller's entire process group: a driver who copy-pastes
 *        the one documented stop command would kill their own shell, editor, and guard
 *        run. so an unknown pid yields no kill command — the line names the record the
 *        warmer writes its pid into at boot, so the driver reads it there for free
 *        rather than re-run a paid review (rule.require.errors-name-the-fix,
 *        rule.require.safe-by-default).
 *
 * .note = the one home of the stop affordance, in two forms: `tree` is a closed
 *         branch of a full warmer tree; `aside` trails a one-line record. both
 *         carry the same stop lever, so no surface can drop the unknown-pid law
 *         (rule.require.single-source-of-truth-for-render).
 *
 * .note = `levers` says whether the `never spawn` lever rides beside `stop`. a
 *         round that spawned a warmer offers both; a round already run with
 *         `--warmer off` offers `stop` alone, since to repeat the flag the driver
 *         just passed reads as though it did not take (rule.forbid.surprises)
 */
export const asWarmerStopLine = (input: {
  pid: number | null;
  reviewer: string;
  prefix: ReviewWarmerPrefix;
  form: 'tree' | 'aside';
  levers: 'stop' | 'stop-and-never-spawn';
}): string => {
  // an unknown pid names where it will appear: the warmer records it at its first
  // beat, within its boot window (rule.require.errors-name-the-fix)
  const kill = asWarmerKillCommand({ pid: input.pid });
  const stop =
    kill === null
      ? `stop: pid not yet recorded — once the warmer boots (≤${MINUTES_OF_WARMER_BOOT}m), read \`pid\` from ${asReviewWarmerRecordPath(input)}, then kill it`
      : `stop: ${kill}`;
  // the lever names the source that turned the warmer on: a review spawns none unless
  // `--warmer` asks, so `--warmer off` alone would read as though warmers were on by default
  const levers =
    input.levers === 'stop'
      ? stop
      : `${stop}  ·  never spawn: drop --warmer from the guard or command`;
  return input.form === 'tree' ? `   └─ ${levers}` : `  ·  ${levers}`;
};
