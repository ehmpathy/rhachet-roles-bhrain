import * as fs from 'fs/promises';

import { enumRouteFiles } from '@src/domain.operations/route/guard/artifact/enumRouteFiles';
import { enumRouteGuardJudgeFiles } from '@src/domain.operations/route/guard/judge/enumRouteGuardJudgeFiles';
import { enumRouteGuardReviewPeerFiles } from '@src/domain.operations/route/guard/review/peer/enumRouteGuardReviewPeerFiles';

/**
 * .what = deletes all guard artifacts for a stone
 * .why = enables rewind to clear validation state but preserve the artifact
 */
export const delStoneGuardArtifacts = async (input: {
  stone: string;
  route: string;
}): Promise<{
  reviews: number;
  judges: number;
  promises: number;
  triggers: {
    blockers: number;
    promises: number;
  };
}> => {
  // collect review files from .reviews/peer/
  const reviewFiles = await enumRouteGuardReviewPeerFiles({
    route: input.route,
    stone: input.stone,
  });

  // collect judge files from .route/
  const judgeFiles = await enumRouteGuardJudgeFiles({
    route: input.route,
    stone: input.stone,
  });

  // collect promise files from .route/
  const promiseFiles = await enumRouteFiles({
    route: input.route,
    glob: `.route/${input.stone}.guard.promise.*.md`,
  });

  // collect triggered files from .route/
  const triggerFiles = await enumRouteFiles({
    route: input.route,
    glob: `.route/${input.stone}.guard.selfreview.*.triggered.*.md`,
  });

  // collect blocked trigger files from .route/
  const blockedTriggerFiles = await enumRouteFiles({
    route: input.route,
    glob: `.route/${input.stone}.blocked.triggered`,
  });

  // delete all found files
  const allFiles = [
    ...reviewFiles,
    ...judgeFiles,
    ...promiseFiles,
    ...triggerFiles,
    ...blockedTriggerFiles,
  ];
  for (const filePath of allFiles) {
    await fs.rm(filePath, { force: true });
  }

  return {
    reviews: reviewFiles.length,
    judges: judgeFiles.length,
    promises: promiseFiles.length,
    triggers: {
      blockers: blockedTriggerFiles.length,
      promises: triggerFiles.length,
    },
  };
};
