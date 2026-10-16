import type { RouteGuardPartitionScope } from './RouteGuardPartitionScope';

/**
 * .what = one partition scope a stone's reviewers read that cannot hold the branch, and
 *         the command that repairs it
 */
export interface StoneGuardPartitionGap {
  scope: RouteGuardPartitionScope;
  /** changed files no partition of the scope claims */
  unclaimed: string[];
  /** partitions of the scope that lack the bound route */
  routeAbsentFrom: string[];
  /** where each unclaimed file lands in the repair */
  placed: Array<{ path: string; slug: string; glob: string }>;
  /** the one paste-ready command that writes the repaired set */
  command: string;
}
