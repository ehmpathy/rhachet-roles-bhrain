import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * .what = check if blocked.triggered file exists for a stone
 * .why = proves robot saw the nudge before block confirmation
 */
export const getBlockedTriggeredReport = async (input: {
  stone: string;
  route: string;
}): Promise<{ triggered: boolean; path: string }> => {
  // compute triggered file path
  const triggeredPath = path.join(
    input.route,
    '.route',
    `${input.stone}.blocked.triggered`,
  );

  // check if file exists
  const triggered = await fs
    .access(triggeredPath)
    .then(() => true)
    .catch(() => false);

  return { triggered, path: triggeredPath };
};
