import * as fs from 'fs/promises';
import * as path from 'path';

import { getOneFileMtimeMs } from '../drive/getOneFileMtimeMs';
import { getOneFileText } from '../drive/getOneFileText';
import { withDriveStateLock } from '../drive/withDriveStateLock';
import { getRepoRootWithFallback } from '../guard/getRepoRootWithFallback';
import {
  asBrainDispatchClaim,
  asBrainDispatchClaimPath,
  BrainDispatchClaim,
  isBrainDispatchClaimLive,
} from './BrainDispatchClaim';
import { setBrainApplyNote } from './setBrainApplyNote';

/**
 * .what = wins the right to dispatch this stone's brain, or reports that a peer holds it
 * .why = a findsert over the claim: a LIVE claim is found (`won: false`); an absent or expired
 *        one is inserted (`won: true`). one process dispatches; concurrent peers stand down
 *
 * .note = the claim is a RESERVATION written BEFORE the dispatch: the lock is sized to one read
 *         and one write (`LOCK_ACQUIRE_TIMEOUT_MS` = 500ms), so it cannot span the probe+spawn.
 *         a failed dispatch must therefore clear it (`delBrainDispatchClaim`), or it would
 *         suppress the next tick's retry for a full window
 * .note = not the `wx` reap claim: that one is released in a `finally`; this one must outlive
 *         its process (the child is detached), so its release is a DEADLINE, read from mtime
 *         (`rule.forbid.timestamps-in-route-artifacts`)
 * .note = text and mtime are read together inside the lock, so no peer can pair an old stone
 *         with a new deadline
 * .note = the mkdir sits outside the lock: the lock file lives in that dir
 */
export const genBrainDispatchClaim = async (input: {
  route: string;
  stone: string;
}): Promise<{ won: boolean }> => {
  const claimPath = asBrainDispatchClaimPath({ route: input.route });
  await fs.mkdir(path.join(input.route, '.route'), { recursive: true });

  const outcome = await withDriveStateLock({
    statePath: claimPath,
    critical: async () => {
      const text = await getOneFileText({ path: claimPath });
      const held = asBrainDispatchClaim({ text });

      // a PRESENT but unreadable claim degrades to "no claim" — flag it here, note it after
      // release (the note costs a git subprocess, too slow for the lock's section)
      const corrupt = text !== null && held === null;

      if (
        isBrainDispatchClaimLive({
          claim: held,
          mtimeMs: await getOneFileMtimeMs({ path: claimPath }),
          stone: input.stone,
          now: Date.now(),
        })
      )
        return { won: false, corrupt };

      // a per-pid temp plus an atomic rename, so a concurrent reader never sees a torn claim
      // .note = the `finally` reaps the temp when the rename fails (ENOSPC, a read-only mount);
      //         a SIGKILL still orphans it, the same residual `mutateDriveBlockerState` carries
      // .note = this arm carries no clamp: every test route to "write lands, rename fails" is
      //         shut (EISDIR on the read first, the lock first on a read-only dir, EXDEV
      //         unreachable in one dir) and this op takes no `fs` seam. residue is bounded at
      //         one stale temp per failed rename
      const tempPath = `${claimPath}.${process.pid}.tmp`;
      const claim = new BrainDispatchClaim({ stone: input.stone });
      try {
        await fs.writeFile(tempPath, JSON.stringify(claim, null, 2));
        await fs.rename(tempPath, claimPath);
      } finally {
        // on the happy path the rename consumed the temp, so ENOENT is expected here
        await fs.unlink(tempPath).catch(() => undefined);
      }

      return { won: true, corrupt };
    },
  });

  // the breadcrumb, after the lock is released
  if (outcome.corrupt)
    setBrainApplyNote({
      repoRoot: await getRepoRootWithFallback({ from: input.route }),
      text: `genBrainDispatchClaim: the dispatch claim at ${claimPath} is present and unreadable, so it was read as NO claim and the dispatch ran`,
    });

  return { won: outcome.won };
};
