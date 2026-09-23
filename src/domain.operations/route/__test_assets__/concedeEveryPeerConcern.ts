import { BadRequestError } from 'helpful-errors';

import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { getStoneUndeclaredConcerns } from '../guard/review/peer/getStoneUndeclaredConcerns';
import { findOneStoneByPattern } from '../stones/asStoneGlob';
import { getAllStones } from '../stones/getAllStones';
import { setStoneAsConcernAbsorbed } from '../stones/setStoneAsConcernAbsorbed';

/**
 * .what = declares `--as conceded` on every concern the stone still owes a stance,
 *         as a driver does by default after it answers a critique it will fix
 * .why = the entrance gate refuses a new review round while any concern stands
 *        undeclared, so any test that drives more than one round must declare a
 *        stance between them — an answer alone no longer buys re-entry. concede is
 *        the DEFAULT stance (S11): it keeps the concern in the tally and keeps the
 *        hold, so the lane re-runs and the round flows exactly as it did before the
 *        gate existed
 *
 * .note = a concede lapses per generation (invariant 3): a fresh round mints a new
 *         given and renumbers its concerns, so this must be called each round, right
 *         after answerEveryPeerGiven — which is the same cadence that helper keeps
 *
 * .note = it reads the undeclared set through getStoneUndeclaredConcerns, the same
 *         operation the entrance gate folds through, so the two grade one corpus and
 *         a concern this helper skips is one the gate would let pass
 *
 * .note = `severity` grades every concede it declares (S14/S16). the default is `better`
 *         — the maintenance floor, hard-capped by the budget: an all-`better` exhaustion
 *         is SHED by the judge and PASSES with no budget increase. pass `urgent` where a
 *         test needs the exhaustion to HOLD the road (an urgent concession keeps its hold,
 *         so the exhaustion halts and warns that the stone earns more budget).
 */
export const concedeEveryPeerConcern = async (input: {
  route: string;
  stone: string;
  severity?: 'better' | 'urgent';
}): Promise<void> => {
  const stones = await getAllStones({ route: input.route });
  const stoneMatched: RouteStone | null = findOneStoneByPattern({
    stones,
    pattern: input.stone,
  });
  if (!stoneMatched)
    throw new BadRequestError(
      [
        `stone not found for concede: ${input.stone}`,
        ``,
        `pass the stone name exactly as it appears among stonesAvailable below, or add`,
        `the stone to the route first.`,
      ].join('\n'),
      {
        route: input.route,
        pattern: input.stone,
        stonesAvailable: stones.map((one) => one.name),
      },
    );

  const lanes = await getStoneUndeclaredConcerns({
    stone: stoneMatched,
    route: input.route,
  });

  // one concede per concern, in report order, so the stance ledger reads as a driver wrote it.
  // --severity is a MANDATORY invariant on a concede (no ungraded concede), so the helper ALWAYS
  // passes one — the caller's grade, or `better` (the maintenance-floor common case) by default.
  const severity = input.severity ?? 'better';
  for (const lane of lanes)
    for (const about of lane.concerns)
      await setStoneAsConcernAbsorbed({
        stone: input.stone,
        route: input.route,
        as: 'conceded',
        with: lane.slug,
        about,
        severity,
      });
};
