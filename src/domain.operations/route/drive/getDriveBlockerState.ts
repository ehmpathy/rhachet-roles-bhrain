import * as fs from 'fs/promises';
import * as path from 'path';

import { DriveBlockerState } from './DriveBlocker';

/**
 * .what = reads current drive blocker state from .route/.drive.blockers.json
 * .why = enables track of consecutive stop blocks
 */
export const getDriveBlockerState = async (input: {
  route: string;
}): Promise<DriveBlockerState> => {
  const statePath = path.join(
    input.route,
    '.route',
    '.drive.blockers.latest.json',
  );

  try {
    const content = await fs.readFile(statePath, 'utf-8');
    const parsed = JSON.parse(content);
    return new DriveBlockerState({
      count: parsed.count ?? 0,
      stone: parsed.stone ?? null,
    });
  } catch {
    // file doesn't exist or invalid, return fresh state
    return new DriveBlockerState({
      count: 0,
      stone: null,
    });
  }
};
