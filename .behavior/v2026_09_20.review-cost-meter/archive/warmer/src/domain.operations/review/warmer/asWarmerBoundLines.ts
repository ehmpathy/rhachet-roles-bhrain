import { asWarmerKillCommand } from './asWarmerKillCommand';
import { asWarmerPlanDense } from './asWarmerPlanDense';
import type { ReviewWarmerSpawn } from './genReviewWarmer';
import { isWarmerPlanMatch } from './isWarmerPlanMatch';

/**
 * .what = the tree lines that state a warmer's bound — the plan it actually runs
 * .why = a findserted warmer holds the plan of the round that spawned it, not the
 *        one this round asked for. two states, rendered as two: the live plan
 *        matches what was asked, so state the bound; or it differs, so name both
 *        since the asked plan was silently discarded (0.wish bar 11).
 *
 * .note = the bound is per review GAP, never a lifetime cap: a real review refills the
 *         poke budget (`setReviewWarmerPokes`), so the line says so, or a driver who
 *         counts more poke rows than the bound under one pid reads a runaway spend
 *
 * .note = a fresh spawn renders no bound lines: its plan is the one just asked for,
 *         and the header already names the reviewer it serves
 */
export const asWarmerBoundLines = (input: {
  spawn: ReviewWarmerSpawn;
}): string[] => {
  const { spawn } = input;

  // a fresh spawn runs the asked plan, so there is no bound to reconcile
  if (spawn.act !== 'found') return [];

  // the live plan matches the ask: state it once
  const live = spawn.live;
  if (isWarmerPlanMatch({ live, asked: spawn.asked }))
    return [`   ├─ bound: ${asWarmerPlanDense(live)} per review gap`];

  // the live plan differs: name both, and how to re-plan. the kill reads the one
  // home of the unknown-pid law; this line is the more dangerous to get wrong,
  // since it reads as a routine re-plan rather than a teardown
  const kill = asWarmerKillCommand({ pid: spawn.pid });
  return [
    `   ├─ bound: ${asWarmerPlanDense(live)} per review gap`,
    `   ├─ asked: ${asWarmerPlanDense(spawn.asked)}  🟡 NOT applied — a live warmer keeps its own plan`,
    kill === null
      ? `   ├─ to re-plan: stop the live warmer, then re-run — it has not yet recorded its pid`
      : `   ├─ to re-plan: ${kill}, then re-run`,
  ];
};
