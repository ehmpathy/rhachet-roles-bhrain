import * as fs from 'fs/promises';

import { asNodeErrnoCode } from '../asNodeErrnoCode';
import { asTempPathBeside } from '../asTempPathBeside';

/**
 * .what = publishes `body` at `path` create-exclusively; returns `{ claimed: true }` when THIS call
 *         created the file, `{ claimed: false }` when one already existed (EEXIST). every other
 *         write fault surfaces (rule.forbid.failhide).
 * .why = the ONE audited home for the atomic-claim protocol. two safety-critical callers rely on
 *        "the filesystem elects exactly one writer": the pid handle (setRouteReminderPidHandle) and the
 *        crash-log slot (setRouteReminderCrashLog). a single implementation removes the drift risk of
 *        two hand-rolled copies — the exact class that produced the crash-breaker read-modify-write
 *        defect, where one safety-critical primitive lived in two places and diverged
 *        (rule.forbid.behavior-hazards — no unguarded read-modify-write; rule.prefer.most-common-denominator).
 *
 * .note = the body is written to a temp file beside the target, then hard-linked into place. a
 *         link either publishes the whole file or fails EEXIST, so a reader never sees a file that is
 *         empty or half-written. a `wx` write would create the file first and fill it second, and a
 *         kill or ENOSPC between the two leaves a torn handle that wedges the clone
 *
 * .note = the caller owns what a LOST race MEANS, so this reports the claimed boolean rather than branch
 *         here — the pid handle reads EEXIST as "someone else claimed, reconcile"; the crash log reads it
 *         as "slot taken, retry the next index". both compose that decision on top of this one primitive.
 */
export const claimExclusiveWrite = async (input: {
  path: string;
  body: string;
}): Promise<{ claimed: boolean }> => {
  const tempPath = asTempPathBeside({ path: input.path });
  try {
    // fill the temp file in full, then link it into place: the target appears whole, or not at all
    await fs.writeFile(tempPath, input.body);
    await fs.link(tempPath, input.path);
    return { claimed: true };
  } catch (error: unknown) {
    // ONLY EEXIST means the path already exists → this call did not claim it. every other write
    // fault (EACCES, ENOSPC) is a real error that must surface (rule.forbid.failhide).
    if (asNodeErrnoCode(error) === 'EEXIST') return { claimed: false };
    throw error;
  } finally {
    // the temp name is unique to this call; drop it whether the link won, lost, or faulted
    await fs.rm(tempPath, { force: true });
  }
};
