import { type ChildProcess, spawn as spawnChildProcess } from 'child_process';
import * as fs from 'fs/promises';
import { UnexpectedCodePathError } from 'helpful-errors';
import * as path from 'path';
import { getGitRepoRoot } from 'rhachet-artifact-git';

import { getRouteReminderDaemonSpawnPlan } from './getRouteReminderDaemonSpawnPlan';
import { getRouteReminderLogPath } from './getRouteReminderLogPath';

/**
 * .what = spawns a RouteReminder daemon as a real DETACHED background process — the host boundary
 * .why = this is the concrete `spawnDaemon` that genRouteReminder injects: it starts the daemon
 *        loop as an OS process that OUTLIVES its parent, which IS the vision's "external, self-exit
 *        daemon" premise. the detachment lived only in a test fixture before (the review's blocker);
 *        it now lives here, in production code, so a real register spawns a real independent daemon.
 *
 * the three flags that make the daemon independent (the review named these as the underspecified
 * seam) are all applied here, not left to a host author to recall:
 * - `detached: true` — the child leads its own process group, so a parent exit does not kill it
 * - `stdio: ['ignore', logFd, logFd]` — the child's stdout+stderr go to a per-session log (the
 *   observability seam: its self-exit reason lands in the log), never to the dead parent terminal
 * - `.unref()` — the parent's event loop does not wait on the child, so the parent can exit at once
 *
 * .note = `spawn` is injected (defaults to child_process.spawn) so a unit test asserts the exact
 *         command + argv + detachment flags WITHOUT a real background loop — the one way to clamp
 *         the detachment contract in code (rule.require.dependency-injection).
 */
export const spawnRouteReminderDaemon = async (
  input: {
    route: string;
    cloneAddr: string;
    intervalMs: number;
    sayTimeoutMs: number;
  },
  context?: {
    spawn?: typeof spawnChildProcess;
    stderr?: (line: string) => void;
  },
): Promise<{ pid: number }> => {
  const spawn = context?.spawn ?? spawnChildProcess;
  const stderr = context?.stderr ?? console.error;

  // run the daemon from the git root so its `.agent/` skill lookup is predictable — a
  // subprocess must never inherit a cwd outside the git root (rule.forbid.cwd-outside-gitroot).
  const cwd = await getGitRepoRoot({ from: process.cwd() });

  // pin the route to an ABSOLUTE path against THIS (register) process's cwd — the caller's cwd —
  // before the child inherits cwd=gitRoot. a relative `--route .` handed to the daemon would
  // otherwise expand against gitRoot, so the daemon would read the WRONG `.route/passage.jsonl`
  // (an absent one), self-exit `route-not-live` on tick 1, and contradict the "spawned and live"
  // the register already reported. this pins the daemon to the route the caller meant.
  const routeAbsolute = path.resolve(input.route);

  // ensure the .route/ dir exists, then open the per-session log for the daemon's stdio. the
  // daemon's self-exit reason is written here (the observability seam).
  const logPath = getRouteReminderLogPath({
    route: routeAbsolute,
    cloneAddr: input.cloneAddr,
  });
  await fs.mkdir(path.dirname(logPath), { recursive: true });
  const logHandle = await fs.open(logPath, 'a');

  // build the exact launch command (a named plan, unit-testable), then spawn it DETACHED with the
  // log as stdout+stderr. the log fd is handed to the child; the parent closes its own copy after.
  const plan = getRouteReminderDaemonSpawnPlan({
    nodePath: process.execPath,
    route: routeAbsolute,
    cloneAddr: input.cloneAddr,
    intervalMs: input.intervalMs,
    sayTimeoutMs: input.sayTimeoutMs,
  });
  let child: ChildProcess;
  try {
    child = spawn(plan.command, plan.args, {
      detached: true,
      stdio: ['ignore', logHandle.fd, logHandle.fd],
      cwd,
    });
    // a detached child can emit `'error'` ASYNCHRONOUSLY — a delayed spawn fault (EACCES, a
    // platform race, a resource limit) fires AFTER this function has already returned its pid.
    // node throws an uncaught exception that crashes the HOST process if such an `'error'` fires
    // with zero listeners (a documented node gotcha, distinct from the sync no-pid check below).
    // a reliability daemon must never crash its own caller on a transient spawn hiccup, so attach
    // a listener that fails LOUD (rule.require.failloud), never swallowed (rule.forbid.failhide).
    // the caller already holds its pid, so this cannot fold into the thrown-error path. it surfaces
    // to stderr (the guaranteed, synchronous floor) AND appends to the WATCHED per-session log (the
    // daemon's own seam), so a human sees the async fault where they watch this session's reminder.
    // the listener is a sync callback, so the log append is fire-and-forget; a failed append itself
    // re-surfaces to stderr, so no fault is hidden.
    child.on('error', (error: Error) => {
      const line = `RouteReminder daemon spawn errored asynchronously (route=${input.route}, cloneAddr=${input.cloneAddr}): ${error.message}`;
      stderr(line);
      void fs.appendFile(logPath, `${line}\n`).catch((logError: unknown) => {
        stderr(
          `RouteReminder daemon spawn-error log write faulted: ${
            logError instanceof Error ? logError.message : String(logError)
          }`,
        );
      });
    });
    // the parent must not wait on the child — the daemon lives on its own
    child.unref();
  } finally {
    // the parent's copy of the log fd is no longer needed once the child holds it
    await logHandle.close();
  }

  // a spawn with no pid never started — fail loud, never return a bogus handle
  // (rule.require.failfast / rule.forbid.failhide)
  if (!child.pid)
    throw new UnexpectedCodePathError(
      'RouteReminder daemon spawn returned no pid',
      { route: input.route, cloneAddr: input.cloneAddr },
    );

  return { pid: child.pid };
};
