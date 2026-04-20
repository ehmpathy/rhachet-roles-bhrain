import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * .what = clears goal blocker state
 * .why = progress clears the reminder streak
 */
export const delGoalBlockerState = async (input: {
  scopeDir: string;
}): Promise<{ cleared: boolean }> => {
  const statePath = path.join(input.scopeDir, '.blockers.latest.json');

  try {
    await fs.rm(statePath, { force: true });
    return { cleared: true };
  } catch {
    return { cleared: false };
  }
};
