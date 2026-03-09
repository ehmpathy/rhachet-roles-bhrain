import * as path from 'path';

import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { RouteStoneGuardApproveArtifact } from '@src/domain.objects/Driver/RouteStoneGuardApproveArtifact';

import { getAllPassageReports } from '../passage/getAllPassageReports';
import { compareStonePrefix } from '../stones/compareStonePrefix';
import {
  computeStoneOrderPrefix,
  getStoneOrderPrefixFromName,
} from '../stones/computeStoneOrderPrefix';

/**
 * .what = retrieves approval artifact for a stone if present and valid
 * .why = enables guard to check if human approval has been granted
 *
 * .note = approvals are invalidated by subsequent rewinds per log order:
 *         if a rewind entry for stone M appears AFTER an approval for stone N,
 *         and M <= N (rewind target is at or before approved stone),
 *         then the approval is stale
 */
export const getOneStoneGuardApproval = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<RouteStoneGuardApproveArtifact | null> => {
  // get all passage reports to check log order
  const reports = await getAllPassageReports({ route: input.route });

  // find latest approval for this stone (with index)
  let approvalIndex = -1;
  for (let i = reports.length - 1; i >= 0; i--) {
    const report = reports[i]!;
    if (report.stone === input.stone.name && report.status === 'approved') {
      approvalIndex = i;
      break;
    }
  }

  // no approval found
  if (approvalIndex === -1) {
    return null;
  }

  // check if any rewind invalidates this approval
  // a rewind invalidates if: it appears AFTER the approval in log,
  // AND the rewound stone prefix <= this stone's prefix
  const thisPrefix = computeStoneOrderPrefix({ stone: input.stone });

  for (let i = approvalIndex + 1; i < reports.length; i++) {
    const report = reports[i]!;
    if (report.status === 'rewound') {
      // extract prefix from rewound stone name
      const rewoundPrefix = getStoneOrderPrefixFromName(report.stone);

      // if rewound stone is at or before this stone, approval is invalid
      if (compareStonePrefix({ a: rewoundPrefix, b: thisPrefix }) <= 0) {
        return null;
      }
    }
  }

  // approval is valid
  return new RouteStoneGuardApproveArtifact({
    stone: { path: input.stone.path },
    path: path.join(input.route, '.route', 'passage.jsonl'),
  });
};
