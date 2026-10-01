import * as fs from 'fs/promises';

import { isENOENT } from '../guard/isENOENT';

/**
 * .what = reads a file's last-write time as epoch millis, and answers `null` where the file
 *         is absent
 * .why = a route artifact may not embed a timestamp; the rule's own exception names the
 *        file's mtime as the remedy for a correctness-critical deadline
 *        (`rule.forbid.timestamps-in-route-artifacts`)
 *
 * .note = same narrow catch as `getOneFileText`: absence is benign; EACCES / EIO travel
 *         (`rule.forbid.failhide`)
 *
 * 🔴 .note = a caller that needs the text AND the mtime to describe ONE file state must hold
 *           a lock across both reads. this build's one caller does — `genBrainDispatchClaim`
 *           reads both inside `withDriveStateLock` — so no peer can rename a new claim
 *           between them and pair an old stone with a new deadline
 */
export const getOneFileMtimeMs = async (input: {
  path: string;
}): Promise<number | null> =>
  await fs
    .stat(input.path)
    .then((stats) => stats.mtimeMs)
    .catch((error: unknown) => {
      if (isENOENT(error)) return null;
      throw error;
    });
