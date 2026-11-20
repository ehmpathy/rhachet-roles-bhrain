import * as path from 'path';

import { PassageReport } from '@src/domain.objects/Driver/PassageReport';
import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { RouteStoneGuardApproveArtifact } from '@src/domain.objects/Driver/RouteStoneGuardApproveArtifact';

import { getAllFulcrumVerdictRows } from '../fulcrum/getAllFulcrumVerdictRows';
import { getAllPassageReports } from '../passage/getAllPassageReports';
import { getAllPassageReportsRaw } from '../passage/getAllPassageReportsRaw';
import { setPassageReport } from '../passage/setPassageReport';
import { isStoneApprovalAfterEveryVerdict } from './isStoneApprovalAfterEveryVerdict';

/**
 * .what = creates approval marker for a stone (findsert pattern)
 * .why = enables human to grant approval for gated milestones
 * .note = idempotent: returns extant while an approval row is on record AND follows every fulcrum
 *         verdict. a verdict after the approval makes a re-approval a new act the passage log
 *         must hold, or a conceded repair could never be answered (r011 i008 blocker.1)
 * .note = the findsert key is the recorded act, never whether the approval is in force: the
 *         in-force rule keeps an ungated stone's approval whatever the debt, so a writer keyed on
 *         it swallowed the re-approval that answers a repair on an ungated stone (r011 i010
 *         blocker.1)
 */
export const setStoneGuardApproval = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<RouteStoneGuardApproveArtifact> => {
  // check if an approval row is on record, after every verdict (findsert guard)
  const [reports, reportsRaw, rows] = await Promise.all([
    getAllPassageReports({ route: input.route }),
    getAllPassageReportsRaw({ route: input.route }),
    getAllFulcrumVerdictRows({ route: input.route }),
  ]);
  const isApprovalOnRecord = reports.some(
    (report) =>
      report.stone === input.stone.name && report.status === 'approved',
  );
  const artifact = new RouteStoneGuardApproveArtifact({
    stone: { path: input.stone.path },
    path: path.join(input.route, '.route', 'passage.jsonl'),
  });
  if (
    isApprovalOnRecord &&
    isStoneApprovalAfterEveryVerdict({
      stone: input.stone.name,
      reports: reportsRaw,
      rows,
    })
  )
    return artifact;

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
