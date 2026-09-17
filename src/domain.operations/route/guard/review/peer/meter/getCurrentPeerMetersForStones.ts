import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import type { GuardPeerMeterStatus } from '../../../tree/formatGuardTree';
import { getCurrentPeerMeters } from './getCurrentPeerMeters';

/**
 * .what = the live peer meters for every stone whose name matches a prefix, flattened to one list
 * .why = the budget emit needs the meters for the stones a bulk `--add` targets, and the route
 *        orchestrator had assembled them inline with a
 *        `stones.filter(...).map(getCurrentPeerMeters)` inside `Promise.all` then `.flat()` — a
 *        pipeline a reader must simulate to see which meters belong to matching stones
 *        (rule.forbid.inline-decode-friction). one named transformer, so the orchestrator reads
 *        as "the meters for these stones".
 *
 * .note = the prefix match is the SAME `startsWith` the guard filter uses, so the meter set and
 *         the guard set agree by construction (a `<name>.guard` basename starts with the stone
 *         name for every variant).
 */
export const getCurrentPeerMetersForStones = async (input: {
  stones: RouteStone[];
  stoneName: string;
  route: string;
}): Promise<GuardPeerMeterStatus[]> => {
  const matched = input.stones.filter((stone) =>
    stone.name.startsWith(input.stoneName),
  );
  const perStone = await Promise.all(
    matched.map((stone) => getCurrentPeerMeters({ stone, route: input.route })),
  );
  return perStone.flat();
};
