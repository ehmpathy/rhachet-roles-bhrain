import { PassageReport } from '@src/domain.objects/Driver/PassageReport';
import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { RouteStoneGuardApproveArtifact } from '@src/domain.objects/Driver/RouteStoneGuardApproveArtifact';

import { setPassageReport } from '../passage/setPassageReport';
import { getOneStoneGuardApproval } from './getOneStoneGuardApproval';

/**
 * .what = creates approval marker for a stone (findsert pattern)
 * .why = enables human to grant approval for gated milestones
 * .note = idempotent: returns extant if already approved
 */
export const setStoneGuardApproval = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<RouteStoneGuardApproveArtifact> => {
  // check if already approved (findsert guard)
  const approvalFound = await getOneStoneGuardApproval({
    stone: input.stone,
    route: input.route,
  });
  if (approvalFound) return approvalFound;

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
