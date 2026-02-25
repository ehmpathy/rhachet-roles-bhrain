import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * .what = deletes the blockedOn report for a stone
 * .why = clears block state when stone passes
 */
export const delStoneGuardBlockerReport = async (input: {
  stone: string;
  route: string;
}): Promise<void> => {
  const routeDir = path.join(input.route, '.route');
  const reportPath = path.join(routeDir, `${input.stone}.blockedOn.json`);

  await fs.rm(reportPath, { force: true });
};
