import * as fs from 'fs/promises';
import * as path from 'path';

import { DriveBlockerState } from './DriveBlocker';
import { getDriveBlockerState } from './getDriveBlockerState';

/**
 * .what = increments drive blocker count
 * .why = tracks consecutive stop blocks for safety cutoff
 */
export const setDriveBlockerState = async (input: {
  route: string;
  stone: string;
}): Promise<{ state: DriveBlockerState }> => {
  const routeDir = path.join(input.route, '.route');
  const statePath = path.join(routeDir, '.drive.blockers.latest.json');

  // ensure .route dir exists
  await fs.mkdir(routeDir, { recursive: true });

  // read current state
  const stateBefore = await getDriveBlockerState({ route: input.route });

  // compute new state
  const stateAfter = new DriveBlockerState({
    count: stateBefore.count + 1,
    stone: input.stone,
  });

  // write state
  await fs.writeFile(statePath, JSON.stringify(stateAfter, null, 2));

  return { state: stateAfter };
};
