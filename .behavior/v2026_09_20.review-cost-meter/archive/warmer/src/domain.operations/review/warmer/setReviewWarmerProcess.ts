import { spawn } from 'child_process';
import * as fs from 'fs';

import { emitReviewRefusal } from '@src/domain.operations/emitReviewRefusal';

import { asReviewWarmerDir } from './asReviewWarmerDir';
import type { ReviewWarmerPlan } from './asReviewWarmerPlan';
import { asWarmerArgv } from './asWarmerArgv';

/**
 * .what = the module the detached child boots, and the export it calls
 * .why = the child is a FRESH node process, so it reaches the warmer the same way
 *        any skill reaches a cli surface — through the package's export map. a
 *        relative path would break the moment this file is bundled to `dist/`.
 */
const ENTRY_OF_WARMER =
  "import('rhachet-roles-bhrain/cli/review._.warmer').then(m => m.reviewWarmer())";

/**
 * .what = starts one detached warmer process for one reviewer, and answers its pid
 * .why = the raw process boundary — the dir the child writes into, the argv it
 *        boots with, and the detach — held in one communicator, so the findsert
 *        `genReviewWarmer` composes named acts rather than spells out a spawn
 *        (rule.prefer.decomposable-architecture).
 *
 * .note = the child is `detached` with `stdio: 'ignore'` and `unref`'d, so it
 *         survives the parent's exit. that is the whole point: `rhx review`
 *         returns in seconds and the prefix must stay warm for the NEXT round,
 *         which arrives after a driver has read and repaired.
 *
 * .note = a `null` pid means the process never started. it is answered rather than
 *         thrown, because the caller holds a lock it must release on that path
 *
 * .note = a pid proves the process STARTED, never that it BOOTED. a child that dies
 *         on import reports `awake` for one round; it never reaches a brain, so it
 *         spends naught, and the next round's liveness probe reads the dead pid and
 *         respawns. a boot-health wait is owed:
 *         `.dream/v2026_09_28.fix.a-warmer-spawn-should-confirm-the-child-booted.md`
 */
export const setReviewWarmerProcess = (input: {
  cwd: string;
  reviewer: string;
  plan: ReviewWarmerPlan;
  logDir: string;
  brain: string;
}): { pid: number | null } => {
  // the dir the child's own voice log lands in must exist before it boots
  fs.mkdirSync(
    asReviewWarmerDir({ cwd: input.cwd, reviewer: input.reviewer }),
    {
      recursive: true,
    },
  );

  // boot the child detached, with the plan on its argv
  const child = spawn(
    process.execPath,
    [
      '-e',
      ENTRY_OF_WARMER,
      '--',
      ...asWarmerArgv({
        reviewer: input.reviewer,
        logDir: input.logDir,
        plan: input.plan,
        brain: input.brain,
      }),
    ],
    { cwd: input.cwd, detached: true, stdio: 'ignore' },
  );

  // a spawn that fails emits 'error' on the NEXT tick. with no listener node throws
  // it as an uncaught event, which crashes the review after its verdict printed. the
  // null pid below reports THAT the spawn failed; the listener reports WHY — the
  // errno — on stderr, since the event lands after this call returns and cannot
  // ride its result (rule.forbid.failhide)
  //
  // .note = the child is `process.execPath` in a cwd this function just created (the
  //         mkdir above), so the event fires only on a host fault — EMFILE, ENOMEM,
  //         EAGAIN — that no test can raise without a stub of `spawn`, which this repo
  //         forbids (rule.forbid.unit.remote-boundaries). so the render is pinned one
  //         call down: `emitReviewRefusal.test.ts [case2]` snaps this exact headline
  //         through the same call (rule.require.contract-snapshot-exhaustiveness)
  child.on('error', (error) => {
    emitReviewRefusal({
      kind: 'malfunction',
      headline: `warmer: the warmer process could not run — ${error.message}`,
      lines: [],
    });
  });
  if (!child.pid) return { pid: null };

  // let the parent exit without a wait on the child
  child.unref();
  return { pid: child.pid };
};
