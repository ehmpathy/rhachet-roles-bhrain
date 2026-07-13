import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * .what = delete blocked.triggered marker file
 * .why = clears blocked state when stone or later stone is passed
 */
export const delBlockedTriggeredReport = async (input: {
  stone: string;
  route: string;
}): Promise<{ deleted: boolean }> => {
  const routeDir = path.join(input.route, '.route');
  const triggeredPath = path.join(routeDir, `${input.stone}.blocked.triggered`);

  try {
    await fs.rm(triggeredPath, { force: true });
    return { deleted: true };
  } catch {
    return { deleted: false };
  }
};
