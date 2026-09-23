import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { isStoneMatchedByName } from '../../../isStoneMatchedByName';
import type { GuardPeerMeterStatus } from '../../../tree/formatGuardTree';
import { getCurrentPeerMeters } from './getCurrentPeerMeters';

/**
 * .what = the live peer meters for every stone the `--stone` value names, flattened to one list
 * .why = the budget emit needs the meters for the stones a bulk `--add` targets, and the route
 *        orchestrator had assembled them inline with a
 *        `stones.filter(...).map(getCurrentPeerMeters)` inside `Promise.all` then `.flat()` — a
 *        pipeline a reader must simulate to see which meters belong to matched stones
 *        (rule.forbid.inline-decode-friction). one named transformer, so the orchestrator reads
 *        as "the meters for these stones".
 *
 * .note = the match is the SAME shared predicate the guard filter uses, so the meter set and the
 *         guard set agree by construction (a `<name>.guard` basename reduces to the stone name
 *         for every variant, and the predicate then holds over both).
 *
 * 🔴 .the match is DELIMITER-AWARE, via `isStoneMatchedByName`, never a bare `startsWith`.
 *    a bare form matches a peer whose name merely opens the same way — `--stone 1.execute` reaches
 *    `1.execute-b` — which makes the budget gate's own scope remedy un-runnable: it prints *"name
 *    the one stone you meant, in full"*, and the full name re-matches both. the predicate carries
 *    the full argument and the safe-direction proof.
 *
 * ⚠️ .the predicate is SHARED with its twin `getTargetGuardPathsForStone` (`route.ts`) rather than
 *    re-spelled. a narrower match at one site alone would leave the other on the wider set, and
 *    the two sets would stop to agree — which is the `.note` above, stated as a constraint.
 */
export const getCurrentPeerMetersForStones = async (input: {
  stones: RouteStone[];
  stoneName: string;
  route: string;
}): Promise<GuardPeerMeterStatus[]> => {
  const matched = input.stones.filter((stone) =>
    isStoneMatchedByName({ stone: stone.name, named: input.stoneName }),
  );
  const perStone = await Promise.all(
    matched.map((stone) => getCurrentPeerMeters({ stone, route: input.route })),
  );
  return perStone.flat();
};
