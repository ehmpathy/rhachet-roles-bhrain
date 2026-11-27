import { realpathSync } from 'fs';
import { ConstraintError } from 'helpful-errors';

import { getRepoRootWithFallback } from '@src/domain.operations/route/guard/getRepoRootWithFallback';

/**
 * .what = the repo root an education face runs against; refuses when cwd is not that root
 * .why = the route bind scans from cwd, and pursuit routes land relative to it, so a face run
 *        from a subdir would write `.route/` in the wrong place or miss the bind. one check at
 *        the face makes the cwd-is-root contract explicit, rather than an implicit hazard
 * .note = paths are compared by realpath, so a symlinked temp dir reads as the same root
 */
export const getOneEducationRepoRoot = async (input: {
  cwd: string;
}): Promise<string> => {
  const repoRoot = await getRepoRootWithFallback({ from: input.cwd });
  if (realpathSync(repoRoot) !== realpathSync(input.cwd))
    throw new ConstraintError('education runs from the repo root', {
      cwd: input.cwd,
      repoRoot,
      hint: `run it from ${repoRoot}`,
    });
  return input.cwd;
};
