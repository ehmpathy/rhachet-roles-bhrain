import { PassageReport } from '@src/domain.objects/Driver/PassageReport';
import {
  RouteStoneGuardBlockerReport,
  type RouteStoneGuardBlockerType,
} from '@src/domain.objects/Driver/RouteStoneGuardBlockerReport';

import { setPassageReport } from '../passage/setPassageReport';

/**
 * .what = writes the blocker report for a stone
 * .why = enables hook mode to read why a stone is blocked
 *
 * .note = the write path always records a CONCRETE guard blocker kind — a driver wall
 *         (no blocker) is written by `--as blocked` directly, not through here — so this
 *         param is the non-null RouteStoneGuardBlockerType, even though the READ shape
 *         (RouteStoneGuardBlockerReport.blocker) is nullable to represent that wall.
 */
export const setStoneGuardBlockerReport = async (input: {
  stone: string;
  route: string;
  blocker: RouteStoneGuardBlockerType;
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
