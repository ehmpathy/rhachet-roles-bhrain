import * as fs from 'fs/promises';
import * as path from 'path';

import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { RouteStoneGuardApproveArtifact } from '@src/domain.objects/Driver/RouteStoneGuardApproveArtifact';

/**
 * .what = retrieves approval artifact for a stone if present
 * .why = enables guard to check if human approval has been granted
 */
export const getOneStoneGuardApproval = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<RouteStoneGuardApproveArtifact | null> => {
  // check for approval marker under .route/
  const approvalPath = path.join(
    input.route,
    '.route',
    `${input.stone.name}.approved`,
  );

  try {
    await fs.access(approvalPath);
    return new RouteStoneGuardApproveArtifact({
      stone: { path: input.stone.path },
      path: approvalPath,
    });
  } catch {
    return null;
  }
};
