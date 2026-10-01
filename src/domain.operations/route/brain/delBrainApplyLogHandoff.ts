import * as fs from 'fs';

import { isBrainApplyLogAbsence } from './isBrainApplyLogAbsence';

/**
 * .what = releases the PARENT's copy of a brain-apply log fd once it is handed to a child's stdio
 * .why = `uv_spawn` dups the fd into the child, and the os reclaims the child's copy on exit;
 *        the parent's original stays open until closed here — one leaked fd per dispatch
 *        otherwise, on the success arm as much as the failure arm
 *
 * .note = called unconditionally, the line after the spawn, so both arms share one path
 * .note = `EBADF` (a spent fd) is absorbed: the call runs after `spawn()` returned, so the
 *         dispatch already succeeded, and a rethrow would kill a healthy driver hook
 *         (`setStoneBrain`, `applyStoneBrainOnEntry` call bare). a foreign fault (`EIO` on a
 *         close flush) is a device fault and travels to `dispatchBrainSwitch`'s synchronous
 *         body, which renders a halt
 * .note = idempotent: a second call hits `EBADF` and returns. `[case1]` (release) and `[case2]`
 *         (convergence) in the integration test pin both
 */
export const delBrainApplyLogHandoff = (input: {
  log: { fd: number; path: string };
}): void => {
  try {
    fs.closeSync(input.log.fd);
  } catch (error) {
    // allowlist, never a bare catch — a foreign fault travels
    if (!isBrainApplyLogAbsence(error)) throw error;
  }
};
