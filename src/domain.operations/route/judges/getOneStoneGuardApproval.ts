import * as path from 'path';

import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { RouteStoneGuardApproveArtifact } from '@src/domain.objects/Driver/RouteStoneGuardApproveArtifact';

import { getOnePassageReport } from '../passage/getOnePassageReport';

/**
 * .what = retrieves approval artifact for a stone if present
 * .why = enables guard to check if human approval has been granted
 */
export const getOneStoneGuardApproval = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<RouteStoneGuardApproveArtifact | null> => {
  // check for approved entry in passage.jsonl
  const approvalReport = await getOnePassageReport({
    stone: input.stone.name,
    status: 'approved',
    route: input.route,
  });

  if (!approvalReport) {
    return null;
  }

  return new RouteStoneGuardApproveArtifact({
    stone: { path: input.stone.path },
    path: path.join(input.route, '.route', 'passage.jsonl'),
  });
};
