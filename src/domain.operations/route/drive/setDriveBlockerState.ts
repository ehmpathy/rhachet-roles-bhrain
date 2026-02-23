import * as fs from 'fs/promises';
import * as path from 'path';

import { DriveBlockerEvent, DriveBlockerState } from './DriveBlocker';
import { getDriveBlockerState } from './getDriveBlockerState';

/**
 * .what = increments drive blocker count and appends to history
 * .why = tracks consecutive stop blocks for observability and safety
 */
export const setDriveBlockerState = async (input: {
  route: string;
  stone: string;
}): Promise<{ state: DriveBlockerState; event: DriveBlockerEvent }> => {
  const routeDir = path.join(input.route, '.route');
  const statePath = path.join(routeDir, '.drive.blockers.latest.json');
  const historyPath = path.join(routeDir, '.drive.blocker.events.jsonl');

  // ensure .route dir exists
  await fs.mkdir(routeDir, { recursive: true });

  // read current state
  const stateBefore = await getDriveBlockerState({ route: input.route });

  // compute new state
  const timestamp = new Date().toISOString();
  const stateAfter = new DriveBlockerState({
    count: stateBefore.count + 1,
    stone: input.stone,
    since: stateBefore.since ?? timestamp,
  });

  // create event for history
  const event = new DriveBlockerEvent({
    stone: input.stone,
    timestamp,
    count: stateAfter.count,
  });

  // write state
  await fs.writeFile(statePath, JSON.stringify(stateAfter, null, 2));

  // append to history
  await fs.appendFile(historyPath, JSON.stringify(event) + '\n');

  return { state: stateAfter, event };
};
