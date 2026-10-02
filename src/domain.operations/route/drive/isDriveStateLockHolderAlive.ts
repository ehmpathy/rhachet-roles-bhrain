/**
 * .what = asks the os whether the pid recorded in a drive-state lock is still a live process
 * .why = it is the ONE gate that parts an abandoned lock from a held one, and a reap that
 *        skips it deletes a live holder's lock — which reopens the lost-update race
 *        `withDriveStateLock` exists to close
 *
 * .how = `process.kill(pid, 0)` sends no signal. it performs the kernel's existence and
 *        permission check and no more, which is the documented probe for exactly this
 *
 * 🔴 .why every uncertain answer is TRUE = the two verdicts have wildly asymmetric costs.
 *        a false DEAD reaps a live holder and grants the lock twice, silently. a false
 *        ALIVE refuses a reap, so the acquire throws with the `rm` fix named — loud, and
 *        one command to clear. ⇒ so this returns `true` on EPERM (a process we may not
 *        signal is still a process) and on any error it cannot classify, and `false` on
 *        ESRCH alone (`rule.require.safe-by-default`)
 *
 * 🟡 .the bound = PID REUSE defeats it, and it fails in the safe direction. if the os has
 *        reissued the dead holder's pid to an unrelated process, this answers `true`, no
 *        reap happens, and the acquire throws the same loud error it threw before any reap
 *        existed. ⇒ the reap is a best-effort recovery of the COMMON case, never a
 *        guarantee, and its failure mode is the prior behavior rather than a new one
 */
export const isDriveStateLockHolderAlive = (input: {
  pid: number;
}): boolean => {
  try {
    process.kill(input.pid, 0);
    return true;
  } catch (error) {
    // ESRCH = no such process. the ONLY code that proves the holder is gone
    if (error && typeof error === 'object' && 'code' in error)
      return (error as { code: string }).code !== 'ESRCH';
    // unclassifiable — see the `.why every uncertain answer is TRUE` note above
    return true;
  }
};
