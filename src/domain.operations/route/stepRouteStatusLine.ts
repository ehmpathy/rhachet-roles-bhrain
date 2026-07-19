import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { getRouteBind } from './bind/getRouteBind';
import { asStatusLine } from './statusLine/asStatusLine';
import { computeNextStones } from './stones/computeNextStones';
import { getAllStoneDriveArtifacts } from './stones/getAllStoneDriveArtifacts';
import { getAllStones } from './stones/getAllStones';

/**
 * .what = computes the claude code status line for the bound route's current stone
 * .why = powers the pinned `🗿 <stone>` status line, so observers glance at the step
 *
 * .note = the claude code harness fires this often (debounced ~300ms). an absent
 *         route or a route with no stones yields an empty line; a bound route whose
 *         stones all passed yields '🗿 route complete 🎉'. neither throws. a genuine
 *         lookup fault is left to propagate — the cli entrypoint runs without a
 *         catch, so the process exits non-zero and the harness blanks the line.
 *         this is fail-open via the harness contract, not a swallowed error.
 *
 * .note = `route` is nullable: null → look up the branch-bound route. tests
 *         pass a route directly to avoid bind conflicts (all tests share a git repo).
 */
export const stepRouteStatusLine = async (input: {
  route: string | null;
}): Promise<{ line: string }> => {
  // derive the route's status-line state, then render it
  const state = await getRouteStatusLineState({ route: input.route });
  return { line: asStatusLine(state) };
};

/**
 * .what = derives the status-line render state for a route (given or branch-bound)
 * .why = isolates the lookup so the orchestrator reads as narrative
 *
 * .note = returns a discriminated state (not a throw) for the expected non-happy
 *         paths. the distinction that matters: a bound route whose stones all passed
 *         is `complete` (celebrate the finish), whereas an unbound route or a route
 *         with no stones is `blank` (no step was passed → render an empty line). a
 *         genuine fault propagates to the caller.
 */
const getRouteStatusLineState = async (input: {
  route: string | null;
}): Promise<
  { kind: 'blank' } | { kind: 'stone'; stone: string } | { kind: 'complete' }
> => {
  // derive the route: the one given, else the branch-bound one
  const route = input.route ?? (await getRouteBind())?.route ?? null;
  if (!route) return { kind: 'blank' };

  // a route with no stones has no step to show (not complete — no stone was passed)
  const stones = await getAllStones({ route });
  if (stones.length === 0) return { kind: 'blank' };

  // compute the current (first incomplete) stone
  const artifacts = await getAllStoneDriveArtifacts({ route });
  const nextStones = computeNextStones({
    stones,
    artifacts,
    query: '@next-one',
  });

  // no incomplete stone remains → the route's stones all passed → complete
  const stoneFirst = asFirstStoneOrNull({ stones: nextStones });
  if (!stoneFirst) return { kind: 'complete' };

  // otherwise, the current stone
  return { kind: 'stone', stone: stoneFirst.name };
};

/**
 * .what = returns the first stone of a list, or null when the list is empty
 * .why = names the positional pick so the orchestrator reads as narrative
 */
const asFirstStoneOrNull = (input: {
  stones: RouteStone[];
}): RouteStone | null => {
  return input.stones[0] ?? null;
};
