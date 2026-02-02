import * as fs from 'fs/promises';
import * as path from 'path';

import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { RouteStoneGuardApproveArtifact } from '@src/domain.objects/Driver/RouteStoneGuardApproveArtifact';

/**
 * .what = creates approval marker for a stone
 * .why = enables human to grant approval for gated milestones
 */
export const setStoneGuardApproval = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<RouteStoneGuardApproveArtifact> => {
  // ensure .route directory found or created
  const routeDir = path.join(input.route, '.route');
  await fs.mkdir(routeDir, { recursive: true });

  // write approval marker
  const approvalPath = path.join(routeDir, `${input.stone.name}.approved`);
  await fs.writeFile(approvalPath, '');

  return new RouteStoneGuardApproveArtifact({
    stone: { path: input.stone.path },
    path: approvalPath,
  });
};
