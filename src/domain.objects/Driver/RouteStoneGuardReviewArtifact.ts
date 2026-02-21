import { DomainEntity, type RefByUnique } from 'domain-objects';

import type { RouteStone } from './RouteStone';

/**
 * .what = represents the output of a peer review run
 * .why = tracks peer review results for guard judgment
 */
export interface RouteStoneGuardReviewPeerArtifact {
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

export class RouteStoneGuardReviewPeerArtifact
  extends DomainEntity<RouteStoneGuardReviewPeerArtifact>
  implements RouteStoneGuardReviewPeerArtifact
{
  public static primary = ['path'] as const;
  public static unique = ['stone', 'hash', 'index'] as const;
}

/**
 * @deprecated use RouteStoneGuardReviewPeerArtifact instead
 */
export type RouteStoneGuardReviewArtifact = RouteStoneGuardReviewPeerArtifact;

/**
 * @deprecated use RouteStoneGuardReviewPeerArtifact instead
 */
export const RouteStoneGuardReviewArtifact = RouteStoneGuardReviewPeerArtifact;
