import * as path from 'path';

import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { RouteStoneGuardApproveArtifact } from '@src/domain.objects/Driver/RouteStoneGuardApproveArtifact';

import { getOneRouteFulcrumDisputeStateOrRefusal } from '../fulcrum/getOneRouteFulcrumDisputeStateOrRefusal';
import { isStoneGatedByHuman } from '../fulcrum/isStoneGatedByHuman';
import { getAllPassageReports } from '../passage/getAllPassageReports';
import { isStoneApprovalInForce } from './isStoneApprovalInForce';

/**
 * .what = retrieves approval artifact for a stone if present and in force
 * .why = enables guard to check if human approval has been granted
 *
 * .note = delegates to getAllPassageReports which handles cross-stone invalidation:
 *         rewind of stone M invalidates approvals for all stones >= M
 * .note = the one reader every "is this stone approved?" caller shares, so the dispute rule
 *         (`isStoneApprovalInForce`) lives here once: a dispute raised after the approval, or a
 *         conceded repair no approval has followed, holds a human-gated stone at its gate
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

  const artifact = new RouteStoneGuardApproveArtifact({
    stone: { path: input.stone.path },
    path: path.join(input.route, '.route', 'passage.jsonl'),
  });

  // a stone with no human gate never halts on a dispute; skip the fulcrum read
  if (!isStoneGatedByHuman({ stone: input.stone })) return artifact;

  // the approval holds only while no dispute or conceded repair holds the gate
  const { state } = await getOneRouteFulcrumDisputeStateOrRefusal({
    route: input.route,
  });
  if (!isStoneApprovalInForce({ stone: input.stone, state })) return null;
  return artifact;
};
