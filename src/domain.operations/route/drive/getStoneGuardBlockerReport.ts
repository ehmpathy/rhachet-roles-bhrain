import * as fs from 'fs/promises';
import * as path from 'path';

import { RouteStoneGuardBlockerReport } from '@src/domain.objects/Driver/RouteStoneGuardBlockerReport';

/**
 * .what = reads the blockedOn report for a stone
 * .why = enables hook mode to check why a stone is blocked
 */
export const getStoneGuardBlockerReport = async (input: {
  stone: string;
  route: string;
}): Promise<RouteStoneGuardBlockerReport | null> => {
  const routeDir = path.join(input.route, '.route');
  const reportPath = path.join(routeDir, `${input.stone}.blockedOn.json`);

  try {
    const content = await fs.readFile(reportPath, 'utf-8');
    const data = JSON.parse(content);
    return new RouteStoneGuardBlockerReport(data);
  } catch {
    return null;
  }
};
