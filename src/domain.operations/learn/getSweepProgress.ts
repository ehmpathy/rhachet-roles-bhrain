import * as fs from 'fs/promises';
import { HelpfulError } from 'helpful-errors';

import { getFsErrorCode } from './getFsErrorCode';

/**
 * .what = read the sweep progress sentinel's mtime + content, or nulls if absent
 * .why = the onStop hook decides freshness from BOTH signals: a recent mtime AND a
 *        real articulation in the content (isProgressArticulated) — so a bare `touch`
 *        cannot silence the nudge. an absent sentinel (first run) reads as
 *        { mtime: null, content: null } → stale (fail toward a nudge, never silence)
 */
export const getSweepProgress = async (input: {
  path: string;
}): Promise<{ mtime: Date | null; content: string | null }> => {
  try {
    const content = await fs.readFile(input.path, 'utf-8');
    const stat = await fs.stat(input.path);
    return { mtime: stat.mtime, content };
  } catch (error) {
    // allowlist ENOENT (sentinel not yet written); a real fault (permission, io)
    // fails loud with the path + code, not an opaque bare rethrow — this feeds the
    // hook's sole trigger, so an opaque stack here would be hard to diagnose
    // (rule.require.failloud). getFsErrorCode reads the code by shape (no as-cast)
    const code = getFsErrorCode(error);
    if (code === 'ENOENT') return { mtime: null, content: null };
    throw new HelpfulError('failed to read the sweep progress sentinel', {
      path: input.path,
      code: code ?? null,
      // the code above is the diagnostic; attach the raw error as cause when it is a
      // real Error (getFsErrorCode already read the code by shape, vm-realm safe)
      cause: error instanceof Error ? error : undefined,
    });
  }
};
