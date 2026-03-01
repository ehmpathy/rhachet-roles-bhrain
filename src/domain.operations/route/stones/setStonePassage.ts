import { PassageReport } from '@src/domain.objects/Driver/PassageReport';
import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { setPassageReport } from '../passage/setPassageReport';

/**
 * .what = marks a stone as passed via passage report
 * .why = enables route progress to be persisted in passage.jsonl
 */
export const setStonePassage = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<{ path: string }> => {
  // create passage report with status passed
  const report = new PassageReport({
    stone: input.stone.name,
    status: 'passed',
  });

  // delegate to setPassageReport
  return setPassageReport({ report, route: input.route });
};
