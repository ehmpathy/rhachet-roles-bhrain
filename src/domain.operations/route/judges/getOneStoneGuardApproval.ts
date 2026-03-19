import * as path from 'path';

import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { RouteStoneGuardApproveArtifact } from '@src/domain.objects/Driver/RouteStoneGuardApproveArtifact';

import { getAllPassageReports } from '../passage/getAllPassageReports';

/**
 * .what = retrieves approval artifact for a stone if present and valid
 * .why = enables guard to check if human approval has been granted
 *
 * .note = delegates to getAllPassageReports which handles cross-stone invalidation:
 *         rewind of stone M invalidates approvals for all stones >= M
 */
export const getOneStoneGuardApproval = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<RouteStoneGuardApproveArtifact | null> => {
  // get passage reports with cross-stone invalidation applied
  const reports = await getAllPassageReports({ route: input.route });

  // find approval for this stone
  const approval = reports.find(
    (r) => r.stone === input.stone.name && r.status === 'approved',
  );
  if (!approval) return null;

  // approval is valid
  return new RouteStoneGuardApproveArtifact({
    stone: { path: input.stone.path },
    path: path.join(input.route, '.route', 'passage.jsonl'),
  });
};
