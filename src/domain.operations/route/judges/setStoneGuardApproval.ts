import { PassageReport } from '@src/domain.objects/Driver/PassageReport';
import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { RouteStoneGuardApproveArtifact } from '@src/domain.objects/Driver/RouteStoneGuardApproveArtifact';

import { setPassageReport } from '../passage/setPassageReport';

/**
 * .what = creates approval marker for a stone
 * .why = enables human to grant approval for gated milestones
 */
export const setStoneGuardApproval = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<RouteStoneGuardApproveArtifact> => {
  // create passage report with status approved
  const report = new PassageReport({
    stone: input.stone.name,
    status: 'approved',
  });

  // delegate to setPassageReport
  const { path: passagePath } = await setPassageReport({
    report,
    route: input.route,
  });

  return new RouteStoneGuardApproveArtifact({
    stone: { path: input.stone.path },
    path: passagePath,
  });
};
