import * as path from 'path';

import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { enumRouteGuardJudgeFiles } from '../judge/enumRouteGuardJudgeFiles';
import { enumRouteGuardReviewPeerFiles } from '../review/peer/enumRouteGuardReviewPeerFiles';

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
  // reviews live in .reviews/peer/, judges live in .route/
  const [reviewFiles, judgeFiles] = await Promise.all([
    enumRouteGuardReviewPeerFiles({
      route: input.route,
      stone: input.stone.name,
    }),
    enumRouteGuardJudgeFiles({ route: input.route, stone: input.stone.name }),
  ]);

  const allFiles = [...reviewFiles, ...judgeFiles];

  // parse iteration from filenames: .i$iter.
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
