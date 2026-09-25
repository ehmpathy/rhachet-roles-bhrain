import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

import { archiveRouteFiles } from './archiveRouteFiles';
import { getStoneYieldGlob } from './getStoneYieldGlob';

/**
 * .what = archive all yield files for a stone to .route/.archive/
 * .why = enables --yield drop to move yields out of the way on rewind
 *
 * .note = the glob is owned by `getStoneYieldGlob`, never hand-typed here. it was one of four
 *         independent derivations until i012; the shared owner is what binds this reader to
 *         `rewindAffectedStones`'s `'keep'` branch, which asks the same question of the same files
 */
export const archiveStoneYield = async (input: {
  stone: string;
  route: string;
}): Promise<{
  outcome: 'archived' | 'absent';
  count: number;
}> => {
  // enumerate all yield files, through the one operation that owns the convention
  const yieldGlob = getStoneYieldGlob({ stone: input.stone });
  const yieldFiles = await enumFilesFromGlob({
    glob: yieldGlob,
    cwd: input.route,
  });

  // the move, and the collision shape it carries, are owned by archiveRouteFiles
  return archiveRouteFiles({ route: input.route, files: yieldFiles });
};
