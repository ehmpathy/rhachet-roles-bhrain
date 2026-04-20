import * as fs from 'fs/promises';
import * as path from 'path';

import { GoalBlockerState } from './GoalBlocker';

/**
 * .what = reads goal blocker state from ${scopeDir}/.blockers.latest.json
 * .why = enables track of consecutive onStop reminders
 */
export const getGoalBlockerState = async (input: {
  scopeDir: string;
}): Promise<GoalBlockerState> => {
  const statePath = path.join(input.scopeDir, '.blockers.latest.json');

  try {
    const content = await fs.readFile(statePath, 'utf-8');
    const parsed = JSON.parse(content);
    return new GoalBlockerState({
      count: parsed.count ?? 0,
      goalSlug: parsed.goalSlug ?? null,
    });
  } catch {
    // file doesn't exist or invalid, return fresh state
    return new GoalBlockerState({
      count: 0,
      goalSlug: null,
    });
  }
};
