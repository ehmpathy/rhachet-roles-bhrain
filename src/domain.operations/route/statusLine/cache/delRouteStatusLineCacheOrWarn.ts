import { getFsErrorCode } from '@src/utils/fs/getFsErrorCode';

import { asStatusLineCacheDropFaultRow } from '../asStatusLineCacheDropFaultRow';
import { delRouteStatusLineCache } from './delRouteStatusLineCache';

/**
 * .what = drops the status line cache; an fs fault of the drop warns on stderr, never fails
 * .why = the bind is the act the caller asked for, and it already landed. the cache is an
 *        optimization: a drop that fails leaves the line stale for at most the cache max
 *        age, so the fault is reported loud with its fix and the bind still succeeds
 *
 * .note = only fs faults (a string `code`) warn; any other error rethrows
 */
export const delRouteStatusLineCacheOrWarn = async (input: {
  cwd: string;
}): Promise<void> => {
  try {
    await delRouteStatusLineCache({ cwd: input.cwd });
  } catch (error) {
    const code = getFsErrorCode(error);
    if (code === null) throw error;
    console.error(asStatusLineCacheDropFaultRow({ code }));
  }
};
