import * as fs from 'fs/promises';

import { withEnoentAsNull } from '../withEnoentAsNull';
import { asStrictPositiveInteger } from './asStrictPositiveInteger';
import { getRouteReminderPidPath } from './getRouteReminderPidPath';

/**
 * .what = removes a clone's pid handle whose body is not a pid (a torn handle); leaves any other be
 * .why = a torn handle makes every strict read throw, so the clone gets no reminder until the file
 *        goes. `del` is the verb a human reaches for, so it must clear it rather than die on it
 *
 * .note = safe to remove: a torn body names no daemon this package can signal, and a live daemon
 *         whose handle vanishes exits `handle-lost` on its next cycle. a claim publishes by link and
 *         fails EEXIST while a file exists, so naught can replace the torn file between the read and
 *         the removal
 *
 * returns the removed handle's path, or null when the handle is absent or names a pid
 */
export const delRouteReminderTornHandle = async (input: {
  repoRoot: string;
  cloneAddr: string;
}): Promise<{ pidPath: string; raw: string } | null> => {
  const pidPath = getRouteReminderPidPath({
    repoRoot: input.repoRoot,
    cloneAddr: input.cloneAddr,
  });

  // an absent handle, or one that names a pid, is not torn: leave it for the normal teardown
  const raw = await withEnoentAsNull(() => fs.readFile(pidPath, 'utf-8'));
  if (raw === null) return null;
  if (asStrictPositiveInteger({ raw }) !== null) return null;

  // a torn handle: remove it, so the next strict read sees an empty slot
  await fs.rm(pidPath, { force: true });
  return { pidPath, raw };
};
