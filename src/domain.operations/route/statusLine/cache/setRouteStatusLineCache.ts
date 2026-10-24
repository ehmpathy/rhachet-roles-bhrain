import * as fs from 'fs';
import * as path from 'path';

import type { RouteStatusLineCacheRecord } from './getOneRouteStatusLineCache';

/**
 * .what = writes the branch's status line cache record, atomically
 * .why = many seats of one worktree repaint at once; each writes the identical render of
 *        identical inputs, so a last-write-wins race loses naught — as long as no reader can
 *        open a half-written file. a temp file + rename gives that: rename is atomic on one
 *        filesystem, so a reader opens the old file or the new one, never a torn one
 *
 * .note = no lock: a last-write-wins cache of a pure render needs no hold
 *         (rule.require.locks-via-with-simple-mutex governs a key one actor holds; none here)
 * .note = an fs fault drops the temp file, then throws to the caller, which reports it loud
 *         and still prints the line. a process killed between write and rename can leave one
 *         `.tmp` beside the cache, in the gitignored cache dir; the read never opens it
 */
export const setRouteStatusLineCache = (input: {
  cachePath: string;
  record: RouteStatusLineCacheRecord;
}): void => {
  // ensure the cache dir, and that it ignores itself
  fs.mkdirSync(path.dirname(input.cachePath), { recursive: true });
  findsertCacheDirGitignore({ dirPath: path.dirname(input.cachePath) });

  // write a temp file unique to this process, then rename it over the cache file
  const tempPath = asRouteStatusLineCacheTempPath({
    cachePath: input.cachePath,
  });
  try {
    fs.writeFileSync(tempPath, JSON.stringify(input.record));
    fs.renameSync(tempPath, input.cachePath);
  } catch (error) {
    // drop the orphan temp file, then surface the fault
    fs.rmSync(tempPath, { force: true });
    throw error;
  }
};

/**
 * .what = writes a `*` `.gitignore` into the cache dir, unless one stands
 * .why = the cache must never show as untracked, even where no `roles link` planted the
 *        `.agent/.cache` ignore (a never-linked repo, an older rhachet). rhachet's own cache
 *        writers self-ignore the same way
 *
 * .note = it runs on a miss alone; a hit writes naught. a race of two writers lands the
 *         same bytes, so last-write-wins loses naught
 */
const findsertCacheDirGitignore = (input: { dirPath: string }): void => {
  const gitignorePath = path.join(input.dirPath, '.gitignore');
  if (fs.existsSync(gitignorePath)) return;
  fs.writeFileSync(gitignorePath, '*\n');
};

/**
 * .what = a temp path beside the cache file, unique to this process and this write
 * .why = two seats that write at once must never share a temp file, or a rename could
 *        publish the other's half-written bytes
 */
const asRouteStatusLineCacheTempPath = (input: { cachePath: string }): string =>
  `${input.cachePath}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
