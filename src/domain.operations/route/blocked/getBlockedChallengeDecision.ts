import * as fs from 'fs/promises';
import * as path from 'path';

import { getBlockedTriggeredReport } from './getBlockedTriggeredReport';

/**
 * .what = determine if blocked attempt should be challenged or allowed
 * .why = enforces two-step flow: trigger → articulate → confirm
 */
export type BlockedChallengeDecision =
  | 'challenge:first'
  | 'challenge:absent'
  | 'allowed';

export const getBlockedChallengeDecision = async (input: {
  stone: string;
  route: string;
}): Promise<{
  decision: BlockedChallengeDecision;
  articulationPath: string;
}> => {
  // compute articulation file path
  const articulationPath = path.join(
    input.route,
    '.route',
    'blocker',
    `${input.stone}.md`,
  );

  // check if triggered file exists (proves robot saw nudge)
  const triggeredReport = await getBlockedTriggeredReport({
    stone: input.stone,
    route: input.route,
  });

  // if no triggered file, this is first attempt
  if (!triggeredReport.triggered) {
    return { decision: 'challenge:first', articulationPath };
  }

  // check if articulation file exists
  const articulationFound = await fs
    .access(articulationPath)
    .then(() => true)
    .catch(() => false);

  // if no articulation, robot hasn't reflected yet
  if (!articulationFound) {
    return { decision: 'challenge:absent', articulationPath };
  }

  // triggered + articulation = allowed
  return { decision: 'allowed', articulationPath };
};
