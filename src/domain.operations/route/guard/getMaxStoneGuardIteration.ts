import * as path from 'path';

import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

/**
 * .what = gets the max iteration number across all guard artifacts for a stone
 * .why = iteration should increment across ALL runs, not just per-hash
 *
 * prior design: iteration was per-hash, so it reset to 1 when hash changed
 * new design: iteration increments across all artifacts regardless of hash
 */
export const getMaxStoneGuardIteration = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<number> => {
  const routeDir = path.join(input.route, '.route');

  // glob for all review and judge files for this stone
  // pattern: $stone.guard.{review,judge}.i$iter.$hash.*
  const reviewGlob = `${input.stone.name}.guard.review.*.md`;
  const judgeGlob = `${input.stone.name}.guard.judge.*.md`;

  const [reviewFiles, judgeFiles] = await Promise.all([
    enumFilesFromGlob({ glob: reviewGlob, cwd: routeDir }).catch(() => []),
    enumFilesFromGlob({ glob: judgeGlob, cwd: routeDir }).catch(() => []),
  ]);

  const allFiles = [...reviewFiles, ...judgeFiles];

  // parse iteration from filenames: $stone.guard.{review,judge}.i$iter.$hash.*
  let maxIteration = 0;
  for (const filePath of allFiles) {
    const filename = path.basename(filePath);
    const iterMatch = filename.match(/\.i(\d+)\./);
    if (iterMatch?.[1]) {
      const iter = parseInt(iterMatch[1], 10);
      if (iter > maxIteration) {
        maxIteration = iter;
      }
    }
  }

  return maxIteration;
};
