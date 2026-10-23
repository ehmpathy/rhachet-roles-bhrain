import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { getAllStoneGuardJudgeVerdictsOfIteration } from '../guard/judge/getAllStoneGuardJudgeVerdictsOfIteration';
import { getCurrentPeerMeters } from '../guard/review/peer/meter/getCurrentPeerMeters';
import type { GuardPeerMeterStatus } from '../guard/tree/formatGuardTree';
import { asStoneGuardRoundIteration } from './asStoneGuardRoundIteration';

/**
 * .what = a stone's latest guard round, read off disk — its iteration, every lane's meter, and
 *         what the judges ruled on it — or null when no peer lane has spoken yet
 * .why = the round's tree prints once, on the `route.stone.set` that ran it. lose that stdout
 *        (a truncated tail, a backgrounded call, a new session) and no surface showed which lanes
 *        rejected or broke, so a driver rebuilt the tally by hand from the givens on disk. the
 *        tool owes that rollup (rule.forbid.adhoc-scope-rollups), and route.drive is the surface
 *        a driver reads first
 *
 * .note = the meters are the same live read every drive halt renders (getCurrentPeerMeters), so
 *         this summary cannot disagree with the halt trees about a lane's verdict
 */
export const getOneStoneGuardRoundLatest = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<{
  iteration: number;
  meters: GuardPeerMeterStatus[];
  judges: { index: number; passed: boolean | null; reason: string | null }[];
} | null> => {
  // a stone with no guard has no round
  if (!input.stone.guard) return null;

  // every lane, as the drive halts read it
  const meters = await getCurrentPeerMeters({
    stone: input.stone,
    route: input.route,
  });

  // the round = the latest given any lane carries; none spoken → no round to show
  const iteration = asStoneGuardRoundIteration({ meters });
  if (iteration === null) return null;

  // what the judges ruled on that round
  const judges = await getAllStoneGuardJudgeVerdictsOfIteration({
    stone: input.stone,
    route: input.route,
    iteration,
  });

  return { iteration, meters, judges };
};
