import { asRouteGuardPartitionPeerKey } from './asRouteGuardPartitionPeerKey';
import type { RouteGuardPartitions } from './getOneRouteGuardPartitions';
import type { RouteGuardPartitionScope } from './RouteGuardPartitionScope';

/**
 * .what = a declaration with one scope's set replaced whole
 * .why = there is no per-slug edit (seed S46): a new set for a scope replaces the old set for
 *        that scope, and leaves every other scope as it stood
 *
 * .note = an empty set clears the scope (fulcrum F105): `@all` reads as none declared, and an
 *         override is removed, so its reviewer falls back to `@all`
 * .note = override keys are sorted, so two equal declarations serialize to the same bytes
 */
export const asRouteGuardPartitionsReplaced = (input: {
  declared: RouteGuardPartitions;
  scope: RouteGuardPartitionScope;
  partition: string[];
}): RouteGuardPartitions => {
  // the standard set; an empty one clears it
  if (input.scope.kind === 'all')
    return {
      all: input.partition.length > 0 ? [...input.partition] : null,
      byPeer: input.declared.byPeer,
    };

  // one reviewer's override; an empty one removes it
  const key = asRouteGuardPartitionPeerKey(input.scope);
  const byPeer = { ...input.declared.byPeer, [key]: [...input.partition] };
  const names = Object.keys(byPeer);
  return {
    all: input.declared.all,
    byPeer: Object.fromEntries(
      [...names]
        .sort()
        .filter((name) => byPeer[name]!.length > 0)
        .map((name) => [name, byPeer[name]!]),
    ),
  };
};
