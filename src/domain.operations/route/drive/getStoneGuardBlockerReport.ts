import { RouteStoneGuardBlockerReport } from '@src/domain.objects/Driver/RouteStoneGuardBlockerReport';

import { getLatestPassageForStone } from '../passage/getLatestPassageForStone';

/**
 * .what = reads the blocker report for a stone
 * .why = enables hook mode to check why a stone is blocked
 * .note = returns null if stone has passed/approved since blocked
 */
export const getStoneGuardBlockerReport = async (input: {
  stone: string;
  route: string;
}): Promise<RouteStoneGuardBlockerReport | null> => {
  // the true chronological latest entry determines the current state
  // .note = getLatestPassageForStone reads raw file order — NOT getAllPassageReports,
  //         whose sticky re-bucket would return a stale 'blocked' after an 'approved'
  const latest = await getLatestPassageForStone({
    stone: input.stone,
    route: input.route,
  });
  if (!latest) return null;

  if (latest.status !== 'blocked') {
    return null; // stone passed or approved since blocked
  }

  // a driver wall (--as blocked, no guard blocker) carries no blocker kind → null,
  // never a fabricated 'judge' (a driver wall is not a judge failure)
  return new RouteStoneGuardBlockerReport({
    stone: latest.stone,
    blocker: latest.blocker ?? null,
    reason: latest.reason ?? null,
  });
};
