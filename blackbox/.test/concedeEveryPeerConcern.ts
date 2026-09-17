import { BadRequestError } from 'helpful-errors';

import { getStoneUndeclaredConcerns } from '../../src/domain.operations/route/guard/review/peer/getStoneUndeclaredConcerns';
import { findOneStoneByPattern } from '../../src/domain.operations/route/stones/asStoneGlob';
import { getAllStones } from '../../src/domain.operations/route/stones/getAllStones';
import { invokeRouteSkill } from './invokeRouteSkill';

/**
 * .what = declares `--as conceded` on every concern the stone still owes a stance, with
 *         one real cli call per concern, exactly as a driver does by default after it
 *         answers a critique it will fix
 * .why = the entrance gate refuses a new review round while any concern stands
 *        undeclared, so any blackbox journey that drives more than one round must
 *        declare a stance between them — an answer alone no longer buys re-entry.
 *        concede is the DEFAULT stance (S11): it keeps the concern in the tally and
 *        keeps the hold, so the lane re-runs and the round flows as it did before the
 *        gate existed
 *
 * .note = 🔴 this is the blackbox twin of
 *         `src/domain.operations/route/__test_assets__/concedeEveryPeerConcern.ts`.
 *         they are deliberately NOT shared: that one mutates in-process, while this one
 *         drives the real cli in a temp dir so the passage ledger records the stance the
 *         way a real driver's would. the READ of the undeclared set goes through the
 *         PRODUCTION operation `getStoneUndeclaredConcerns` — the same fold the entrance
 *         gate uses — so the two grade one corpus and a concern this helper skips is one
 *         the gate would let pass. a pure read imported across the boundary is the extant
 *         pattern here (see the twin `answerEveryPeerGiven`); only the state MUTATION goes
 *         through the cli.
 *
 * .note = a concede lapses per generation (invariant 3): a fresh round mints a new given
 *         and renumbers its concerns, so this must be called each round, right after
 *         answerEveryPeerGiven — which is the same cadence that helper keeps
 */
export const concedeEveryPeerConcern = async (input: {
  cwd: string;
  stone: string;
  route?: string;
  /**
   * grades every concede it declares (S14/S16). default `better` — the maintenance floor,
   * hard-capped by the budget: an all-`better` exhaustion is SHED by the judge and PASSES.
   * pass `urgent` where a journey needs the exhaustion to HOLD the road (an urgent concession
   * keeps its hold, so the exhaustion halts and warns a human).
   */
  severity?: 'better' | 'urgent';
}): Promise<void> => {
  const route = input.route ?? input.cwd;

  const stones = await getAllStones({ route });
  const stoneMatched = findOneStoneByPattern({
    stones,
    pattern: input.stone,
  });
  if (!stoneMatched)
    throw new BadRequestError(`stone not found for concede: ${input.stone}`, {
      route,
      pattern: input.stone,
      stonesAvailable: stones.map((one) => one.name),
    });

  const lanes = await getStoneUndeclaredConcerns({ stone: stoneMatched, route });

  // one concede per concern, in report order, so the stance ledger reads as a driver wrote it.
  // --severity is a MANDATORY invariant on a concede (no ungraded concede), so the helper ALWAYS
  // sends one — the caller's grade, or `better` (the maintenance-floor common case) by default.
  const severity = input.severity ?? 'better';
  for (const lane of lanes)
    for (const about of lane.concerns)
      await invokeRouteSkill({
        skill: 'route.stone.set',
        args: {
          stone: input.stone,
          route: input.route ?? '.',
          as: 'conceded',
          with: lane.slug,
          about,
          severity,
        },
        cwd: input.cwd,
      });
};
