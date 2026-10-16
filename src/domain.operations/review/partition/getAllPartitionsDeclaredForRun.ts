import {
  asReviewPartitionsFromFlags,
  type ReviewPartitionDeclared,
} from './asReviewPartitionsFromFlags';
import { getAllPartitionsOfLane } from './getAllPartitionsOfLane';

/**
 * .what = the partitions one review run splits by: the caller's own `--partition` flags, else
 *         the set its route declares for this reviewer
 * .why = a route declares its partitions once, and every reviewer reuses them (seed S45). the
 *        caller reads that declaration from the route context and passes it in as plain flags,
 *        so the review context holds no reach into route internals (rule.forbid.scope-leaks)
 *
 * .note = the caller's flags win where both exist: a hand run states its own split. a route
 *         set is narrowed to the partitions with work in this lane; a caller's set is not,
 *         since the caller named it for this run alone
 */
export const getAllPartitionsDeclaredForRun = (input: {
  /** the `--partition` values the caller passed */
  partitions: string[];
  /** the `--partition` values the route declares for this run's reviewer; empty for none */
  partitionsOfRoute: string[];
  /** the route this run was driven from, relative to cwd; null for none */
  route: string | null;
  /** the lane's targets, after its bind and filters */
  targets: string[];
}): ReviewPartitionDeclared[] => {
  // a caller's own declaration
  if (input.partitions.length > 0)
    return asReviewPartitionsFromFlags({ partition: input.partitions });

  // the route's set, narrowed to the partitions with work in this lane
  return getAllPartitionsOfLane({
    partitions: asReviewPartitionsFromFlags({
      partition: input.partitionsOfRoute,
    }),
    targets: input.targets,
    route: input.route,
  });
};
