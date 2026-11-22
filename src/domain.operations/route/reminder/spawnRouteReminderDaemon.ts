import { type ChildProcess, spawn as spawnChildProcess } from 'child_process';
import * as fs from 'fs/promises';
import { UnexpectedCodePathError } from 'helpful-errors';
import * as path from 'path';
import { getGitRepoRoot } from 'rhachet-artifact-git';

import { getRouteReminderDaemonSpawnPlan } from './getRouteReminderDaemonSpawnPlan';
import { getRouteReminderLogPath } from './getRouteReminderLogPath';
import { setRouteReminderHandleDir } from './setRouteReminderHandleDir';

/**
 * .what = spawns a clone's RouteReminder daemon as a real DETACHED background process — the host
 *         boundary
 * .why = this is the concrete `spawnDaemon` that genRouteReminder injects: it starts the daemon
 *        loop as an OS process that OUTLIVES its parent, which IS the "external, self-exit daemon"
 *        premise.
 *
 * the three flags that make the daemon independent are all applied here:
 * - `detached: true` — the child leads its own process group, so a parent exit does not kill it
 * - `stdio: ['ignore', logFd, logFd]` — the child's stdout+stderr go to the clone log (the
 *   observability seam: its self-exit reason lands in the log), never to the dead parent terminal
 * - `.unref()` — the parent's event loop does not wait on the child, so the parent can exit at once
 *
 * .note = the daemon is told its anchor (`--repo-root`) explicitly, never left to infer it from its
 *         cwd: the cwd is pinned to the caller's git root for skill lookup, which need not be the
 *         dir the clone handle anchors on (a hermetic test anchors on a temp dir)
 *
 * .note = `spawn` is injected (defaults to child_process.spawn) so a unit test asserts the exact
 *         command + argv + detachment flags WITHOUT a real background loop
 *         (rule.require.dependency-injection).
 */
export const spawnRouteReminderDaemon = async (
  input: {
    repoRoot: string;
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

  // absolutize the anchor against THIS process's cwd: the child runs from the git root, so a
  // relative `--repo-root` would be read against the wrong dir and the daemon would find no focus
  const repoRoot = path.resolve(input.repoRoot);

  // ensure the clone handle dir exists, then open the clone log for the daemon's stdio. the
  // daemon's self-exit reason is written here (the observability seam).
  const logPath = getRouteReminderLogPath({
    repoRoot,
    cloneAddr: input.cloneAddr,
  });
  await setRouteReminderHandleDir({ dirPath: path.dirname(logPath) });
  const logHandle = await fs.open(logPath, 'a');

  // build the exact launch command (a named plan, unit-testable), then spawn it DETACHED with the
  // log as stdout+stderr. the log fd is handed to the child; the parent closes its own copy after.
  const plan = getRouteReminderDaemonSpawnPlan({
    nodePath: process.execPath,
    repoRoot,
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
    // a detached child can emit `'error'` ASYNCHRONOUSLY, after this function returned its pid.
    // node crashes the HOST process if such an `'error'` fires with zero listeners, so attach a
    // listener that fails LOUD to stderr AND the clone log (rule.require.failloud), never swallowed.
    child.on('error', (error: Error) => {
      const line = `RouteReminder daemon spawn errored asynchronously (repoRoot=${repoRoot}, cloneAddr=${input.cloneAddr}): ${error.message}`;
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
  if (!child.pid)
    throw new UnexpectedCodePathError(
      'RouteReminder daemon spawn returned no pid',
      { repoRoot, cloneAddr: input.cloneAddr },
    );

  return { pid: child.pid };
};
