import { asRouteGuardPartitionPeerKey } from './asRouteGuardPartitionPeerKey';
import type { RouteGuardPartitions } from './getOneRouteGuardPartitions';

/**
 * .what = the `--partition` values one reviewer on one stone reads from its route
 * .why = an override for that reviewer replaces the standard set whole (seed S46); with no
 *        override, the reviewer reads the standard set; with neither, it reads none
 */
export const getAllPartitionFlagsOfReviewer = (input: {
  declared: RouteGuardPartitions;
  stone: string;
  peer: string;
}): string[] =>
  input.declared.byPeer[
    asRouteGuardPartitionPeerKey({ stone: input.stone, peer: input.peer })
  ] ??
  input.declared.all ??
  [];
