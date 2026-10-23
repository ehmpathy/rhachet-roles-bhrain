import { asRouteGuardPartitionPeerKey } from './asRouteGuardPartitionPeerKey';
import type { RouteGuardPartitions } from './getOneRouteGuardPartitions';
import type { RouteGuardPartitionScope } from './RouteGuardPartitionScope';

/**
 * .what = the set a scope holds as declared, or null where it holds none
 * .why = a new declaration replaces the scope whole (seed S46), so the render names what it
 *        replaces. unlike `getAllPartitionFlagsOfReviewer`, an override scope does NOT fall
 *        back to `@all` here — the question is what this one scope holds, not what a reviewer reads
 */
export const getAllPartitionFlagsOfScope = (input: {
  declared: RouteGuardPartitions;
  scope: RouteGuardPartitionScope;
}): string[] | null =>
  input.scope.kind === 'all'
    ? input.declared.all
    : (input.declared.byPeer[asRouteGuardPartitionPeerKey(input.scope)] ??
      null);
