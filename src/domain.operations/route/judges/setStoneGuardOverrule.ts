import * as path from 'path';

import { PassageReport } from '@src/domain.objects/Driver/PassageReport';
import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { setPassageReport } from '../passage/setPassageReport';
import { getStoneGuardOverruledLevels } from './getStoneGuardOverruledLevels';

/**
 * .what = creates an overrule marker for a stone, scoped to a review level
 * .why = enables a human to bypass the review threshold for one level, so the
 *        next level can still run (leveled overrule). the judge is the top rung
 *        (JUDGE_LEVEL), so an overrule of the judge is just an overrule at that
 *        level — every overrule scopes to exactly one rung, never the whole ladder.
 * .note = idempotent: returns extant if this level is already overruled
 */
export const setStoneGuardOverrule = async (input: {
  stone: RouteStone;
  route: string;
  level: number;
}): Promise<{ path: string }> => {
  // findsert guard: skip if this level is already overruled
  const levels = await getStoneGuardOverruledLevels({
    stone: input.stone,
    route: input.route,
  });
  if (levels.has(input.level)) {
    return { path: path.join(input.route, '.route', 'passage.jsonl') };
  }

  // create passage report with status overruled, scoped to the level
  const report = new PassageReport({
    stone: input.stone.name,
    status: 'overruled',
    level: input.level,
  });

  // delegate to setPassageReport
  const { path: passagePath } = await setPassageReport({
    report,
    route: input.route,
  });

  return { path: passagePath };
};
