import * as path from 'path';

import { PassageReport } from '@src/domain.objects/Driver/PassageReport';
import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { setPassageReport } from '../passage/setPassageReport';
import { getStoneGuardOverruledLevels } from './getStoneGuardOverruledLevels';

/**
 * .what = creates an overrule marker for a stone, scoped to a review level
 * .why = enables a human to bypass the review threshold for one level, so the
 *        next level can still run (leveled overrule)
 * .note = idempotent: returns extant if this level is already overruled
 * .note = level omitted = legacy stone-wide overrule (forgives all levels)
 */
export const setStoneGuardOverrule = async (input: {
  stone: RouteStone;
  route: string;
  level?: number;
}): Promise<{ path: string }> => {
  // findsert guard: skip if this level (or legacy all) is already overruled
  const { levels, all } = await getStoneGuardOverruledLevels({
    stone: input.stone,
    route: input.route,
  });
  const alreadyOverruled =
    input.level === undefined ? all : levels.has(input.level);
  if (alreadyOverruled) {
    return { path: path.join(input.route, '.route', 'passage.jsonl') };
  }

  // create passage report with status overruled (scoped to level when given)
  const report = new PassageReport({
    stone: input.stone.name,
    status: 'overruled',
    ...(input.level !== undefined ? { level: input.level } : {}),
  });

  // delegate to setPassageReport
  const { path: passagePath } = await setPassageReport({
    report,
    route: input.route,
  });

  return { path: passagePath };
};
