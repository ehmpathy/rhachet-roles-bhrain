import { asNodeErrnoCode } from '../asNodeErrnoCode';

/**
 * .what = signals a process to stop, and reports whether a live process was signalled
 * .why = the reminder signals a pid in two places (the teardown's SIGTERM, the register's
 *        orphan-reap SIGKILL). one named communicator owns the `process.kill` boundary + its
 *        errno allowlist, so neither caller re-inlines the swallow-or-throw logic
 *        (rule.prefer.decomposable-architecture, rule.forbid.failhide).
 *
 * returns `{ stopped: true }` when the signal was delivered to a live process, `{ stopped:
 * false }` when the pid was already gone (ESRCH — a benign no-op for idempotent teardown). any
 * other errno (EPERM alive-but-not-mine, EINVAL) is a real fault that surfaces, never swallowed.
 */
export const stopProcess = (input: {
  pid: number;
  signal: NodeJS.Signals;
}): { stopped: boolean } => {
  try {
    process.kill(input.pid, input.signal);
    return { stopped: true };
  } catch (error: unknown) {
    // ONLY ESRCH means the pid died before the signal → no live process to stop. surface the rest.
    if (asNodeErrnoCode(error) === 'ESRCH') return { stopped: false };
    throw error;
  }
};
