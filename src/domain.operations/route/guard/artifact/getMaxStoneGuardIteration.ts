import * as path from 'path';

import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { enumRouteGuardJudgeFiles } from '../judge/enumRouteGuardJudgeFiles';
import { enumRouteGuardReviewPeerFiles } from '../review/peer/enumRouteGuardReviewPeerFiles';
import { asGuardArtifactIteration } from './asGuardArtifactIteration';

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

  // read each artifact's iteration marker: `.iNNN.` on a review, `.iNNNp` on a judge
  const iterations = [...reviewFiles, ...judgeFiles].map(
    (filePath) =>
      asGuardArtifactIteration({ filename: path.basename(filePath) }) ?? 0,
  );

  // the max across all, or 0 when the stone has no artifacts yet
  return Math.max(0, ...iterations);
};
