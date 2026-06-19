import * as path from 'path';

import { PassageReport } from '@src/domain.objects/Driver/PassageReport';
import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { setPassageReport } from '../passage/setPassageReport';
import { getOneStoneGuardOverrule } from './getOneStoneGuardOverrule';

/**
 * .what = creates overrule marker for a stone (findsert pattern)
 * .why = enables human to bypass review thresholds for gated milestones
 * .note = idempotent: returns extant if already overruled
 */
export const setStoneGuardOverrule = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<{ path: string }> => {
  // check if already overruled (findsert guard)
  const overruleFound = await getOneStoneGuardOverrule({
    stone: input.stone,
    route: input.route,
  });
  if (overruleFound) {
    return { path: path.join(input.route, '.route', 'passage.jsonl') };
  }

  // create passage report with status overruled
  const report = new PassageReport({
    stone: input.stone.name,
    status: 'overruled',
  });

  // delegate to setPassageReport
  const { path: passagePath } = await setPassageReport({
    report,
    route: input.route,
  });

  return { path: passagePath };
};
