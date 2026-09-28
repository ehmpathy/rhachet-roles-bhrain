import { asNodeErrnoCode } from '../asNodeErrnoCode';

/**
 * .what = probes whether a pid names a live process — the `kill -0` liveness check
 * .why = the reminder reads process liveness in three places (detect, the register orphan-reap,
 *        the teardown). one named communicator owns the probe so the `kill(pid, 0)` idiom and
 *        its errno allowlist live in a single home, not re-inlined per caller
 *        (rule.prefer.decomposable-architecture).
 *
 * `kill(pid, 0)` sends no signal — it only asks the kernel "does this pid exist and may i
 * signal it?". success = alive. ESRCH (no such process) = dead/absent. any other errno (EPERM
 * alive-but-not-mine, EINVAL) is a real fault that must surface (rule.forbid.failhide).
 *
 * .note = ACCEPTED RESIDUAL — pid-as-identity. this probe treats a bare pid as the daemon's whole
 *         identity. if a daemon dies uncleanly (crash / OOM-kill), its handle survives as stale,
 *         and the OS recycles that pid for an UNRELATED process before the next register's
 *         reconcile runs, two rare failure modes open: a stranger process reads as "live" (a dead
 *         reminder looks alive), or the teardown SIGTERM/SIGKILLs that stranger. this is the
 *         standard pid-file daemon tradeoff, accepted here as bounded: the window is the gap
 *         between an unclean death and the next reconcile, pid recycle within it is unlikely, and
 *         the blast radius is one stray signal / one false-live read — not a correctness break. a
 *         future defense (if the residual ever bites) is a start-time or nonce cross-check
 *         (`/proc/<pid>/stat`, or a nonce in the handle + the daemon's argv), deferred as YAGNI
 *         until a real incident demands it (rule.prefer.wet-over-dry).
 */
export const isProcessAlive = (input: { pid: number }): boolean => {
  try {
    process.kill(input.pid, 0);
    return true;
  } catch (error: unknown) {
    // ONLY ESRCH means the process is gone → not alive. every other errno is a real fault.
    if (asNodeErrnoCode(error) === 'ESRCH') return false;
    throw error;
  }
};
