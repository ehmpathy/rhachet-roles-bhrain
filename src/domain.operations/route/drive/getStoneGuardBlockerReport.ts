import { RouteStoneGuardBlockerReport } from '@src/domain.objects/Driver/RouteStoneGuardBlockerReport';

import { getAllPassageReports } from '../passage/getAllPassageReports';

/**
 * .what = reads the blocker report for a stone
 * .why = enables hook mode to check why a stone is blocked
 * .note = returns null if stone has passed/approved since blocked
 */
export const getStoneGuardBlockerReport = async (input: {
  stone: string;
  route: string;
}): Promise<RouteStoneGuardBlockerReport | null> => {
  // get all passage reports
  const reports = await getAllPassageReports({ route: input.route });

  // filter to this stone and get latest
  const stoneReports = reports.filter((r) => r.stone === input.stone);
  if (stoneReports.length === 0) {
    return null;
  }

  // latest entry determines current state
  const latest = stoneReports[stoneReports.length - 1]!;
  if (latest.status !== 'blocked') {
    return null; // stone passed or approved since blocked
  }

  return new RouteStoneGuardBlockerReport({
    stone: latest.stone,
    blocker: latest.blocker ?? 'judge',
    reason: latest.reason ?? null,
  });
};
