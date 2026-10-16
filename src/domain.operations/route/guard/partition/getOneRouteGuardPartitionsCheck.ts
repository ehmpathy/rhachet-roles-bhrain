import { ConstraintError } from 'helpful-errors';

// a sanctioned exposure, declared in src/domain.operations/review/partition/.readme.md
import { asReviewPartitionRefusal } from '@src/domain.operations/review/partition/asReviewPartitionRefusal';
import { asReviewPartitionsFromFlags } from '@src/domain.operations/review/partition/asReviewPartitionsFromFlags';
import {
  getAllTargetsByPartition,
  type ReviewPartitionSplit,
} from '@src/domain.operations/review/partition/getAllTargetsByPartition';
import { getAllStoneGuardReviewTargetPaths } from '@src/domain.operations/route/guard/review/getAllStoneGuardReviewTargetPaths';

import { asRouteGuardPartitionCommand } from './asRouteGuardPartitionCommand';
import { getAllTokensByTargetPath } from './getAllTokensByTargetPath';
import type { RouteGuardPartitionScope } from './RouteGuardPartitionScope';

/**
 * .what = a proposed route partition set, split against every file the branch changed, and
 *         the refusal it earns, if any
 * .why = the whole set is declared at once (seed S46), so coverage is checked at declaration,
 *        before the write: a changed file no partition claims, or a partition that lacks the
 *        route spec, refuses here rather than on some later round of some later lane
 *
 * .note = the target set is the one every guard lane draws from — since-main, less the scope
 *         polluters (`getAllStoneGuardReviewTargetPaths`). a lane's own bind narrows it, so a
 *         set that covers this covers every lane that reads a diff. each lane still re-checks
 *         its own split at review time, which catches a lane bound beyond the diff
 * .note = no window check here: the window is a property of each lane's brain and head, so it
 *         is checked per lane when that lane runs
 */
export const getOneRouteGuardPartitionsCheck = async (input: {
  partition: string[];
  /** the route dir, relative to cwd */
  route: string;
  cwd: string;
  /**
   * the scope the set is held under, so a refusal carries the repaired set as one paste-ready
   * command; null where the caller words its own fix
   */
  repairOf: RouteGuardPartitionScope | null;
}): Promise<{
  targets: string[];
  split: ReviewPartitionSplit;
  /** the estimated tokens of each changed file's body — the mass each partition's globs move */
  tokensByPath: Map<string, number>;
  refusal: { headline: string; lines: string[] } | null;
}> => {
  // a declaration of no partitions is no declaration. the refusal names the route and the
  // paste-ready command, as every other partition refusal does (rule.require.errors-name-the-fix)
  if (input.partition.length === 0) {
    const command = asRouteGuardPartitionCommand({
      route: input.route,
      scope: input.repairOf ?? { kind: 'all' },
    });
    throw new ConstraintError(
      [
        `no partition declared for route ${input.route}: declare the whole set, one --partition '<slug>=<globs>' per partition`,
        ``,
        `  ${command.head} \\`,
        `    --partition '<slug>=<globs>' \\`,
        `  ${command.tail}`,
      ].join('\n'),
    );
  }

  // split every changed file across the proposed set
  const partitions = asReviewPartitionsFromFlags({
    partition: input.partition,
  });
  const targets = await getAllStoneGuardReviewTargetPaths({
    repoRoot: input.cwd,
  });
  const split = getAllTargetsByPartition({
    targets,
    partitions,
    route: input.route,
  });

  // the same refusals a review run would raise, ahead of the write
  const refusal = asReviewPartitionRefusal({
    split,
    costs: null,
    tokensByPath: null,
    route: input.route,
    repairVia: input.repairOf
      ? {
          partition: input.partition,
          command: asRouteGuardPartitionCommand({
            route: input.route,
            scope: input.repairOf,
          }),
        }
      : null,
  });
  // the mass of each changed file, so a read shows each partition's size before a round
  const tokensByPath = await getAllTokensByTargetPath({
    targets,
    cwd: input.cwd,
  });
  return { targets, split, tokensByPath, refusal };
};
