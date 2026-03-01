import { PassageReport } from '@src/domain.objects/Driver/PassageReport';
import { RouteStoneGuardBlockerReport } from '@src/domain.objects/Driver/RouteStoneGuardBlockerReport';

import { setPassageReport } from '../passage/setPassageReport';

/**
 * .what = writes the blocker report for a stone
 * .why = enables hook mode to read why a stone is blocked
 */
export const setStoneGuardBlockerReport = async (input: {
  stone: string;
  route: string;
  blocker: RouteStoneGuardBlockerReport['blocker'];
  reason: string | null;
}): Promise<{ report: RouteStoneGuardBlockerReport }> => {
  // create passage report with status blocked
  const passageReport = new PassageReport({
    stone: input.stone,
    status: 'blocked',
    blocker: input.blocker,
    reason: input.reason ?? undefined,
  });

  // delegate to setPassageReport
  await setPassageReport({ report: passageReport, route: input.route });

  // return blocker report for compatibility
  const report = new RouteStoneGuardBlockerReport({
    stone: input.stone,
    blocker: input.blocker,
    reason: input.reason,
  });

  return { report };
};
