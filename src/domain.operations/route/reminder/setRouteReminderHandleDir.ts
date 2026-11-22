import * as fs from 'fs/promises';
import * as path from 'path';

import { withEnoentAsNull } from '../withEnoentAsNull';

/**
 * .what = ensures the clone handle dir exists, and that it ignores itself
 * .why = the handles live under `.agent/.cache/`, which a linked repo already ignores. a repo that
 *        was never linked (or an older rhachet) would show the pid, log, and focus as untracked;
 *        a `*` `.gitignore` in the dir keeps them out of every diff. mirrors the status-line cache's
 *        own findsert (setRouteStatusLineCache)
 *
 * .note = idempotent: the mkdir is recursive, and an extant `.gitignore` is left as is. two
 *         writers that race land the same bytes, so last-write-wins loses naught
 */
export const setRouteReminderHandleDir = async (input: {
  dirPath: string;
}): Promise<void> => {
  await fs.mkdir(input.dirPath, { recursive: true });

  // findsert the self-ignore; an extant one is kept
  const gitignorePath = path.join(input.dirPath, '.gitignore');
  const gitignoreFound = await withEnoentAsNull(() => fs.stat(gitignorePath));
  if (gitignoreFound) return;
  await fs.writeFile(gitignorePath, '*\n');
};
