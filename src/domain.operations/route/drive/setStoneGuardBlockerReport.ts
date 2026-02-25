import * as fs from 'fs/promises';
import * as path from 'path';

import { RouteStoneGuardBlockerReport } from '@src/domain.objects/Driver/RouteStoneGuardBlockerReport';

/**
 * .what = writes the blockedOn report for a stone
 * .why = enables hook mode to read why a stone is blocked
 */
export const setStoneGuardBlockerReport = async (input: {
  stone: string;
  route: string;
  blockedOn: RouteStoneGuardBlockerReport['blockedOn'];
  reason: string | null;
}): Promise<{ report: RouteStoneGuardBlockerReport }> => {
  const routeDir = path.join(input.route, '.route');
  const reportPath = path.join(routeDir, `${input.stone}.blockedOn.json`);

  // ensure .route dir exists
  await fs.mkdir(routeDir, { recursive: true });

  // create report
  const report = new RouteStoneGuardBlockerReport({
    stone: input.stone,
    blockedOn: input.blockedOn,
    reason: input.reason,
  });

  // write report
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

  return { report };
};
