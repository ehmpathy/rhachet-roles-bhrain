import * as fs from 'fs/promises';
import * as path from 'path';

import { GoalBlockerState } from './GoalBlocker';
import { getGoalBlockerState } from './getGoalBlockerState';

/**
 * .what = increments goal blocker count
 * .why = tracks consecutive reminders for escalation
 */
export const setGoalBlockerState = async (input: {
  scopeDir: string;
  goalSlug: string;
}): Promise<{ state: GoalBlockerState }> => {
  const statePath = path.join(input.scopeDir, '.blockers.latest.json');

  // ensure scopeDir exists
  await fs.mkdir(input.scopeDir, { recursive: true });

  // read current state
  const stateBefore = await getGoalBlockerState({ scopeDir: input.scopeDir });

  // compute new state
  const stateAfter = new GoalBlockerState({
    count: stateBefore.count + 1,
    goalSlug: input.goalSlug,
  });

  // write state
  await fs.writeFile(statePath, JSON.stringify(stateAfter, null, 2));

  return { state: stateAfter };
};
