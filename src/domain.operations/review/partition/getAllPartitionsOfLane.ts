import { isPathOfRouteSpec } from '@src/domain.operations/review/isPathOfRouteSpec';

import type { ReviewPartitionDeclared } from './asReviewPartitionsFromFlags';
import { isPathOfPartition } from './isPathOfPartition';

/**
 * .what = the route-declared partitions that claim some of one lane's own targets
 * .why = a route declares its partitions once for every reviewer (seed S45), and each lane
 *        reads a different slice of the code. a partition that claims none of a lane's
 *        targets would grade only the shared route spec — a duplicate run with no subject —
 *        so it drops out of that lane
 *
 * .note = a target under the route counts for no partition here: every partition holds the
 *         route, so a claim on it says naught about whether the partition has work in the lane
 */
export const getAllPartitionsOfLane = (input: {
  partitions: ReviewPartitionDeclared[];
  targets: string[];
  route: string | null;
}): ReviewPartitionDeclared[] => {
  // the lane's own work, with the shared spec held out
  const targetsOwn = getAllTargetsOwnOfLane({
    targets: input.targets,
    route: input.route,
  });

  // keep each partition that claims at least one of them, in declared order
  return input.partitions.filter((partition) =>
    isPartitionWithLaneWork({ partition, targets: targetsOwn }),
  );
};

/**
 * .what = the lane's own targets, with the shared route spec held out
 * .why = one named slice, so the lane filter reads "the lane's own work" rather than a
 *        negated filter to simulate (rule.forbid.inline-decode-friction)
 */
const getAllTargetsOwnOfLane = (input: {
  targets: string[];
  route: string | null;
}): string[] =>
  input.targets.filter(
    (path) => !isPathOfRouteSpec({ path, route: input.route }),
  );

/**
 * .what = whether a partition claims at least one of the lane's own targets
 * .why = one named predicate, so the keep reads "partitions with work in the lane"
 */
const isPartitionWithLaneWork = (input: {
  partition: ReviewPartitionDeclared;
  targets: string[];
}): boolean =>
  input.targets.some((path) =>
    isPathOfPartition({ path, partition: input.partition }),
  );
