// a sanctioned exposure, declared in src/domain.operations/review/partition/.readme.md
import { asReviewPartitionFlagsMerged } from '@src/domain.operations/review/partition/asReviewPartitionFlagsMerged';
import { setOneFileAtomic } from '@src/infra/fs/setOneFileAtomic';

import { asRouteGuardPartitionsPath } from './asRouteGuardPartitionsPath';
import { asRouteGuardPartitionsReplaced } from './asRouteGuardPartitionsReplaced';
import {
  getOneRouteGuardPartitions,
  type RouteGuardPartitions,
} from './getOneRouteGuardPartitions';
import type { RouteGuardPartitionScope } from './RouteGuardPartitionScope';

/**
 * .what = writes a whole partition set for one scope — the standard set, or one reviewer's
 * .why = a declaration always names the whole set and replaces what stood (seed S46), so
 *        coverage is checked against the full set before the write, never against a set
 *        half-edited slug by slug
 *
 * .note = idempotent: the same declaration twice writes the same bytes. keys are sorted so
 *         the file diffs cleanly in review
 * .note = a read-modify-write with no lock, deliberately. one driver per route declares
 *         partitions by hand, so two concurrent `--mode apply` runs are out of scope. if two
 *         did overlap, the later write would replace the earlier scope's declaration whole,
 *         and the next `route.guard.partition` read would show the set that stands. to rerun
 *         the lost declaration restores it, since the operation is idempotent
 * .note = the write itself is an atomic swap (`setOneFileAtomic`): the reader is another
 *         process (`getOneRouteGuardPartitions`, on every guarded `rhx review`), so an
 *         in-place write could hand it a torn body and refuse a valid declaration
 */
export const setRouteGuardPartitions = async (input: {
  route: string;
  cwd: string;
  scope: RouteGuardPartitionScope;
  partition: string[];
}): Promise<{ before: RouteGuardPartitions; after: RouteGuardPartitions }> => {
  // read what stands, then replace this one scope whole, one value per slug
  const before = await getOneRouteGuardPartitions({
    route: input.route,
    cwd: input.cwd,
  });
  const after = asRouteGuardPartitionsReplaced({
    declared: before,
    scope: input.scope,
    partition: asReviewPartitionFlagsMerged({ partition: input.partition }),
  });

  // write it beside the route's other engine state, as one atomic swap
  const filePath = asRouteGuardPartitionsPath({
    route: input.route,
    cwd: input.cwd,
  });
  await setOneFileAtomic({
    path: filePath,
    content: `${JSON.stringify(after, null, 2)}\n`,
    mtime: null,
  });
  return { before, after };
};
