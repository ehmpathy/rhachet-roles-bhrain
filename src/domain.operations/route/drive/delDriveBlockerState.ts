import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * .what = clears drive blocker state (resets count to 0)
 * .why = approval clears the block streak
 */
export const delDriveBlockerState = async (input: {
  route: string;
}): Promise<{ cleared: boolean }> => {
  const statePath = path.join(
    input.route,
    '.route',
    '.drive.blockers.latest.json',
  );

  try {
    await fs.rm(statePath, { force: true });
    return { cleared: true };
  } catch {
    return { cleared: false };
  }
};
