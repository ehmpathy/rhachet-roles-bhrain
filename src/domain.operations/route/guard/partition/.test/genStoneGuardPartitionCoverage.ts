import { asReviewPartitionsFromFlags } from '@src/domain.operations/review/partition/asReviewPartitionsFromFlags';
import { getAllTargetsByPartition } from '@src/domain.operations/review/partition/getAllTargetsByPartition';

import { asStoneGuardPartitionGap } from '../asStoneGuardPartitionGap';
import type { StoneGuardPartitionCoverage } from '../getOneStoneGuardPartitionCoverage';
import type { RouteGuardPartitionScope } from '../RouteGuardPartitionScope';

/**
 * .what = a coverage fixture built through the real pure splitter and gap transformers
 * .why = a formatter test reads the very shape the communicator answers, with no branch read
 */
export const genStoneGuardPartitionCoverage = (input: {
  route: string;
  scope: RouteGuardPartitionScope;
  peers: string[] | null;
  partition: string[];
  targets: string[];
}): StoneGuardPartitionCoverage => {
  const split = getAllTargetsByPartition({
    targets: input.targets,
    partitions: asReviewPartitionsFromFlags({ partition: input.partition }),
    route: input.route,
  });
  return {
    scope: input.scope,
    peers: input.peers,
    partition: input.partition,
    targets: input.targets,
    split,
    // each target priced alike, so a render's mass clause reads as a plain count
    tokensByPath: new Map(input.targets.map((path) => [path, 1_000])),
    gap: asStoneGuardPartitionGap({
      scope: input.scope,
      partition: input.partition,
      split,
      route: input.route,
    }),
    refusal: null,
  };
};
