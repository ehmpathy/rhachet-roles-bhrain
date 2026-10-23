// a sanctioned exposure, declared in src/domain.operations/review/partition/.readme.md
import type { ReviewPartitionSplit } from '@src/domain.operations/review/partition/getAllTargetsByPartition';

import { asStoneGuardPartitionGap } from './asStoneGuardPartitionGap';
import { getOneRouteGuardPartitionsCheck } from './getOneRouteGuardPartitionsCheck';
import type { RouteGuardPartitionScope } from './RouteGuardPartitionScope';
import type { StoneGuardPartitionGap } from './StoneGuardPartitionGap';

/**
 * .what = how one partition scope holds the branch: every changed file, how the set splits
 *         it, and the gap it leaves (if any)
 */
export interface StoneGuardPartitionCoverage {
  scope: RouteGuardPartitionScope;
  /** the reviewers on the stone that read this scope; null where no stone was named */
  peers: string[] | null;
  /** the partition set the scope holds, as declared */
  partition: string[];
  /** every file changed since main, less the scope polluters */
  targets: string[];
  split: ReviewPartitionSplit;
  /** the estimated tokens of each changed file's body */
  tokensByPath: Map<string, number>;
  /** the gap and its repair; null where the scope holds the branch */
  gap: StoneGuardPartitionGap | null;
  /** the refusal `rhx route.guard.partition` prints for this set; null where it holds */
  refusal: { headline: string; lines: string[] } | null;
}

/**
 * .what = checks one partition scope against the branch, read-only and brain-free
 * .why = 🔴 the ONE per-scope computation both the entrance gate and the coverage read run,
 *        so a driver who reads coverage before arrival sees exactly the verdict the gate will
 *        reach — never a second census that could disagree (rule.forbid.adhoc-scope-rollups)
 */
export const getOneStoneGuardPartitionCoverage = async (input: {
  scope: RouteGuardPartitionScope;
  peers: string[] | null;
  partition: string[];
  /** the route dir, relative to cwd */
  route: string;
  cwd: string;
}): Promise<StoneGuardPartitionCoverage> => {
  // split every changed file across the scope's set
  const check = await getOneRouteGuardPartitionsCheck({
    partition: input.partition,
    route: input.route,
    cwd: input.cwd,
    repairOf: input.scope,
  });

  // the verdict
  return {
    scope: input.scope,
    peers: input.peers,
    partition: input.partition,
    targets: check.targets,
    split: check.split,
    tokensByPath: check.tokensByPath,
    gap: asStoneGuardPartitionGap({
      scope: input.scope,
      partition: input.partition,
      split: check.split,
      route: input.route,
    }),
    refusal: check.refusal,
  };
};
