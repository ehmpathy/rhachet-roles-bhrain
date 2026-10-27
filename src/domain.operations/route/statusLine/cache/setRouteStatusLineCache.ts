import * as path from 'path';

import { findsertGitignore } from '@src/domain.operations/route/gitignore/findsertGitignore';
import { setOneFileAtomic } from '@src/infra/fs/setOneFileAtomic';

import type { RouteStatusLineCacheRecord } from './getOneRouteStatusLineCache';

/**
 * .what = writes the branch's status line cache record, atomically
 * .why = many seats of one worktree repaint at once; each writes the identical render of
 *        identical inputs, so a last-write-wins race loses naught — as long as no reader can
 *        open a half-written file. an atomic swap gives that (`setOneFileAtomic`)
 *
 * .note = no lock: a last-write-wins cache of a pure render needs no hold
 *         (rule.require.locks-via-with-simple-mutex governs a key one actor holds; none here)
 * .note = an fs fault throws to the caller, which reports it loud and still prints the line.
 *         the draft `setOneFileAtomic` writes is removed in its `finally`, so a fault leaves
 *         no orphan in the cache dir
 */
export const setRouteStatusLineCache = async (input: {
  cachePath: string;
  record: RouteStatusLineCacheRecord;
}): Promise<void> => {
  // ensure the cache dir, and that it ignores itself: the cache must never show as
  // untracked, even where no `roles link` planted the `.agent/.cache` ignore
  await findsertGitignore({
    dir: path.dirname(input.cachePath),
    content: '*\n',
  });

  // write the record whole
  await setOneFileAtomic({
    path: input.cachePath,
    content: JSON.stringify(input.record),
    mtime: null,
  });
};
