import * as path from 'path';

import { findStoneByName } from '../../stones/findStoneByName';
import { getAllStones } from '../../stones/getAllStones';
import { getAllGuardPeerSlugs } from './getAllGuardPeerSlugs';
import type { RouteGuardPartitionScope } from './RouteGuardPartitionScope';

/**
 * .what = the refusal a scope earns when it names a stone the route does not hold, or a
 *         reviewer that stone's guard does not declare — null when the scope is real
 * .why = 🔴 a one-reviewer override is keyed `$stone/$peer`, and no reader of that key ever
 *        reports a key it cannot match. a typo'd stone or peer would be written, reported as a
 *        success, and then read by no lane — the override silently does naught. the refusal
 *        names what the route DOES hold, so the fix is a re-type, never a hunt
 *
 * .note = `@all` names every reviewer on every stone, so it can name naught absent
 */
export const getOneRouteGuardPartitionScopeRefusal = async (input: {
  /** the route dir — relative to cwd, or absolute */
  route: string;
  cwd: string;
  scope: RouteGuardPartitionScope;
}): Promise<{ headline: string; lines: string[] } | null> => {
  // @all is the standard, so there is no stone or peer to look up
  if (input.scope.kind === 'all') return null;

  // the stone must sit on the route
  const stones = await getAllStones({
    route: path.isAbsolute(input.route)
      ? input.route
      : path.join(input.cwd, input.route),
  });
  const stone = findStoneByName({ stones, name: input.scope.stone });
  if (!stone)
    return {
      headline: `stone ${input.scope.stone} not found on route ${input.route}`,
      lines: asHeldLines({
        noun: 'stones',
        held: stones.map((one) => one.name),
        fix: 'name a stone of the route with --stone',
      }),
    };

  // the peer must be one of that stone's guard reviewers
  const slugs = getAllGuardPeerSlugs({ guard: stone.guard });
  if (!slugs.includes(input.scope.peer))
    return {
      headline: `peer ${input.scope.peer} is not a reviewer of stone ${stone.name}`,
      lines: asHeldLines({
        noun: 'peers',
        held: slugs,
        fix: 'name one of its reviewers with --peer, or --peer @all for every one',
      }),
    };
  return null;
};

/**
 * .what = the tree lines that list what the route holds, then the fix
 * .why = one shape for both refusals, so a stone and a peer typo read alike
 */
const asHeldLines = (input: {
  noun: string;
  held: string[];
  fix: string;
}): string[] => [
  `   ├─ held ${input.noun}: ${input.held.length > 0 ? input.held.join(', ') : '(none)'}`,
  `   └─ fix: ${input.fix}`,
];
