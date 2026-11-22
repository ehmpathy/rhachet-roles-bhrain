import * as fs from 'fs/promises';
import * as path from 'path';

import { withEnoentAsNull } from '../withEnoentAsNull';

/**
 * .what = the roots a repo keeps routes under: `.behavior/` (behavior routes) and `.route/`
 *         (the route templates a repo binds by hand)
 */
const ROUTE_ROOTS_OF_REPO = ['.behavior', '.route'] as const;

/**
 * .what = the route dirs a repo holds, at depth one under each route root
 * .why = the legacy sweep must visit each route the clone may once have driven; a literal depth-one
 *        read per root, never a recursive glob (rule.forbid.unbounded-recursive-globs)
 *
 * returns absolute dir paths. an absent root holds no route → none from it.
 */
export const getAllRouteDirsOfRepo = async (input: {
  repoRoot: string;
}): Promise<string[]> => {
  const perRoot = await Promise.all(
    ROUTE_ROOTS_OF_REPO.map((root) =>
      getAllDirsAt({ dir: path.join(input.repoRoot, root) }),
    ),
  );
  return perRoot.flat();
};

/**
 * .what = the child dirs of one dir; an absent dir → []
 * .why = one read per route root, so the two roots share one shape
 */
const getAllDirsAt = async (input: { dir: string }): Promise<string[]> => {
  const entries =
    (await withEnoentAsNull(() =>
      fs.readdir(input.dir, { withFileTypes: true }),
    )) ?? [];
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(input.dir, entry.name));
};
