import * as fs from 'fs/promises';

import { isEEXIST } from '../guard/isEEXIST';
import { isENOENT } from '../guard/isENOENT';
import { delOneFile } from './delOneFile';
import { getOneFileText } from './getOneFileText';
import { isDriveStateLockHolderAlive } from './isDriveStateLockHolderAlive';

/**
 * .what = the path of the claim that serializes REAPERS of one lock
 * .why = exported so `withDriveStateLock`'s acquire error names the same file in its `rm` fix
 *        (`rule.require.single-source-of-truth-for-render`)
 */
export const asReapClaimPath = (input: { lockPath: string }): string =>
  `${input.lockPath}.reap`;

/**
 * .what = creates the reap claim and returns it ONLY where this process provably holds the path
 * .why = `wx` proves the path was absent at create time, not after; a peer that recovers a stale
 *        claim unlinks by path, so two reapers can each hold an fd. an INODE compare of handle
 *        vs path is the one fact that survives a concurrent unlink-and-recreate
 *
 * .note = the pid is written BEFORE the check, so a peer reads an owner; an empty read parses to
 *         `NaN`, which the caller treats as "not provably dead" — the safe direction
 */
const genReapClaimHandle = async (input: {
  claimPath: string;
}): Promise<fs.FileHandle | null> => {
  const handle = await fs
    .open(input.claimPath, 'wx')
    .catch((error: unknown) => {
      if (isEEXIST(error)) return null;
      throw error;
    });
  if (!handle) return null;

  await handle.write(`${process.pid}\n`);

  const [ours, theirs] = await Promise.all([
    handle.stat(),
    fs.stat(input.claimPath).catch((error: unknown) => {
      if (isENOENT(error)) return null;
      throw error;
    }),
  ]);
  if (theirs && theirs.ino === ours.ino) return handle;

  // a peer took the path out from under this handle — stand down
  await handle.close();
  return null;
};

/**
 * .what = wins the reap claim, and recovers it first where its prior holder is PROVABLY gone
 * .why = a reaper killed before its `finally` release would leave the claim forever, and every
 *        later reap would stand down — a permanent manual-only wedge
 *
 * .note = the recovery rests on `kill(pid, 0)`'s ESRCH, never on age. a double recovery is safe:
 *         the loser's inode compare in `genReapClaimHandle` fails, so it stands down — the
 *         recovery is a hint, `wx` plus the inode compare is the decision
 * .note = exactly ONE recovery attempt; a claim still held after it has a live holder
 */
const genReapClaim = async (input: {
  claimPath: string;
}): Promise<fs.FileHandle | null> => {
  const won = await genReapClaimHandle(input);
  if (won) return won;

  // the claim is held. read its owner — the same proof the lock reap rests on, one level up
  const text = await getOneFileText({ path: input.claimPath });
  if (text === null) return await genReapClaimHandle(input); // it went away mid-read

  const pid = Number.parseInt(text.trim(), 10);

  // an unreadable owner is not a dead one (covers the create/write window too)
  if (!Number.isInteger(pid) || pid <= 0) return null;
  if (isDriveStateLockHolderAlive({ pid })) return null;

  await delOneFile({ path: input.claimPath });
  return await genReapClaimHandle(input);
};

/**
 * .what = removes a drive-state lock whose holder is PROVABLY gone, and reports whether it did
 * .why = a driver hook killed between the lock's `wx` open and its release leaves the lock
 *        behind, and every later tick throws until a human runs the named `rm`
 *
 * .note = a naive reap reintroduces the race the lock closes: two reapers read one dead pid,
 *         both unlink, and the second unlinks the lock the first re-won. the reap claim (`wx`,
 *         so the kernel grants it to one) serializes reapers
 * .note = three gates in series, each required: the claim is won · the lock is RE-READ under
 *         the claim (the caller's earlier judgment may be stale) · `isDriveStateLockHolderAlive`
 *         answers false. any failure reaps naught
 * .note = residual: a reused pid reads alive, so its claim is not recovered. it fails toward a
 *         stand-down, and the acquire error names both files for a manual `rm`
 * .note = idempotent: an already-reaped lock reads ENOENT and returns `true`
 */
export const delAbandonedDriveStateLock = async (input: {
  lockPath: string;
}): Promise<boolean> => {
  const claimPath = asReapClaimPath({ lockPath: input.lockPath });

  // gate 1 — win the right to reap
  const claim = await genReapClaim({ claimPath });
  if (!claim) return false;

  try {
    // gate 2 — re-read the lock UNDER the claim. the caller's judgment is discarded
    const text = await getOneFileText({ path: input.lockPath });

    // already gone — a peer reaped it, or a human did. a retry may win it
    if (text === null) return true;

    const pid = Number.parseInt(text.trim(), 10);

    // an unreadable pid is not a dead one. refuse, and let the acquire throw its loud error
    if (!Number.isInteger(pid) || pid <= 0) return false;

    // gate 3 — the os's own verdict, and the only one that authorizes a delete
    if (isDriveStateLockHolderAlive({ pid })) return false;

    await delOneFile({ path: input.lockPath });
    return true;
  } finally {
    // safe to unlink: a peer recovers only a claim whose owner is provably gone, and this
    // process is alive while it runs this `finally`
    await claim.close();
    await delOneFile({ path: claimPath });
  }
};
