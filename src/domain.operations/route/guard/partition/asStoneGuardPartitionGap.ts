// a sanctioned exposure, declared in src/domain.operations/review/partition/.readme.md
import type { ReviewPartitionSplit } from '@src/domain.operations/review/partition/getAllTargetsByPartition';

import { asRouteGuardPartitionRepair } from './asRouteGuardPartitionRepair';
import type { RouteGuardPartitionScope } from './RouteGuardPartitionScope';
import type { StoneGuardPartitionGap } from './StoneGuardPartitionGap';

/**
 * .what = the gap one partition scope leaves in a split, with its repair — or null when the
 *         scope claims every changed file and carries the route spec in each partition
 * .why = the pure half of the per-scope check, apart from its read of the branch, so the
 *        entrance gate and the coverage read derive their verdict from one transformer
 */
export const asStoneGuardPartitionGap = (input: {
  scope: RouteGuardPartitionScope;
  partition: string[];
  split: ReviewPartitionSplit;
  /** the route dir, relative to cwd */
  route: string;
}): StoneGuardPartitionGap | null => {
  // a scope that claims every file and carries the route in each partition holds
  const { unclaimed, routeAbsentFrom } = input.split;
  if (unclaimed.length === 0 && routeAbsentFrom.length === 0) return null;

  // compute the one command that repairs the scope
  const repair = asRouteGuardPartitionRepair({
    partition: input.partition,
    unclaimed,
    routeAbsentFrom,
    route: input.route,
    scope: input.scope,
  });
  return {
    scope: input.scope,
    unclaimed,
    routeAbsentFrom,
    placed: repair.placed,
    command: repair.command,
  };
};
