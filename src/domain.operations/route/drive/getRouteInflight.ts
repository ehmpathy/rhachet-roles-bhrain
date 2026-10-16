import * as fs from 'fs/promises';
import { MalfunctionError } from 'helpful-errors';
import * as path from 'path';

import { isErrorOfAbsence } from '@src/utils/fs/isErrorOfAbsence';

import { asRouteStoneSetCommandHead } from '../guard/review/peer/asRouteStoneSetCommandHead';
import { RouteInflight } from './RouteInflight';

/**
 * .what = the watermark's content and mtime, read through one open handle — or null if absent
 * .why = a handle outlives an unlink, so a concurrent delete cannot land between the read
 *        and the stat; absence is decided once, at the open
 */
const getOneWatermarkRead = async (input: {
  statePath: string;
}): Promise<{ content: string; mtimeMs: number } | null> => {
  const handle = await fs.open(input.statePath, 'r').catch((error) => {
    if (isErrorOfAbsence({ error })) return null;
    throw error;
  });
  if (handle === null) return null;
  try {
    const content = await handle.readFile('utf-8');
    const { mtimeMs } = await handle.stat();
    return { content, mtimeMs };
  } finally {
    await handle.close();
  }
};

/**
 * .what = reads the repairs-in-flight watermark from `$route/.route/inflight.json`
 * .why = the stop hook decides from it whether a wait on delegated work is honest
 *
 * .note = absent file → null. a malformed file fails loud: a watermark the hook cannot
 *         read must never silently read as "no repairs in flight" (rule.forbid.failhide)
 * .note = `since` is read from the file's mtime, never the json body
 *         (rule.forbid.timestamps-in-route-artifacts)
 */
export const getRouteInflight = async (input: {
  route: string;
}): Promise<RouteInflight | null> => {
  const statePath = path.join(input.route, '.route', 'inflight.json');

  // read the content and its mtime through ONE open handle; absence means no watermark
  // .note = the absence decision is the one shared allowlist (`isErrorOfAbsence`: ENOENT and
  //         ENOTDIR), never re-derived here; every other fault rethrows
  // .note = 🔴 one handle, never a read then a path stat: `delRouteInflight` runs in another
  //         process (every --as arrived|passed|blocked), and a delete between two path-based
  //         syscalls made the stat throw a bare ENOENT out of the stop hook. an open handle
  //         survives an unlink, so the read and the stat see the same file or neither does
  const read = await getOneWatermarkRead({ statePath });
  if (read === null) return null;
  const { content, mtimeMs } = read;

  // the recovery both faults name: the watermark is disposable, so a corrupt one is cleared
  const fix = `delete ${statePath}, or re-mark the wait: ${asRouteStoneSetCommandHead({ stone: '<stone>' })} --as inflight --what '<what>'`;

  // parse and validate the shape
  const parsed = (() => {
    try {
      return JSON.parse(content);
    } catch (error) {
      throw new MalfunctionError(
        `inflight watermark is not valid json; fix: ${fix}`,
        {
          statePath,
          error: error instanceof Error ? error.message : String(error),
        },
      );
    }
  })();
  if (typeof parsed?.stone !== 'string' || typeof parsed?.what !== 'string')
    throw new MalfunctionError(
      `inflight watermark lacks { stone, what }; fix: ${fix}`,
      { statePath, parsed },
    );

  // `since` is the file's mtime, read through the same handle as its content
  return new RouteInflight({
    stone: parsed.stone,
    since: mtimeMs,
    what: parsed.what,
  });
};
