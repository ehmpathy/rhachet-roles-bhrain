import { DomainEntity, type RefByUnique } from 'domain-objects';

import type { RouteStone } from './RouteStone';

/**
 * .what = represents the output of a review run
 * .why = tracks review results for guard judgment
 */
export interface RouteStoneGuardReviewArtifact {
  /**
   * reference to the stone by unique key (path)
   */
  stone: RefByUnique<typeof RouteStone>;

  /**
   * artifact content hash
   */
  hash: string;

  /**
   * attempt number (increments when hash changes)
   */
  iteration: number;

  /**
   * review index (r1, r2, etc)
   */
  index: number;

  /**
   * path to review file under .route/
   */
  path: string;

  /**
   * count of blocker issues found
   */
  blockers: number;

  /**
   * count of nitpick issues found
   */
  nitpicks: number;
}

export class RouteStoneGuardReviewArtifact
  extends DomainEntity<RouteStoneGuardReviewArtifact>
  implements RouteStoneGuardReviewArtifact
{
  public static primary = ['path'] as const;
  public static unique = ['stone', 'hash', 'index'] as const;
}
