import { DomainLiteral, type RefByUnique } from 'domain-objects';

import type { RouteStone } from './RouteStone';

/**
 * .what = represents a promise artifact for a self-review
 * .why = tracks which self-reviews the clone has promised for a stone
 */
export interface RouteStoneGuardReviewSelfArtifact {
  /**
   * reference to the stone by unique key (path)
   */
  stone: RefByUnique<typeof RouteStone>;

  /**
   * hash of source artifacts at promise time
   */
  hash: string;

  /**
   * self-review slug that was promised
   */
  slug: string;

  /**
   * full path to promise artifact file
   */
  path: string;
}

export class RouteStoneGuardReviewSelfArtifact
  extends DomainLiteral<RouteStoneGuardReviewSelfArtifact>
  implements RouteStoneGuardReviewSelfArtifact
{
  public static unique = ['stone', 'slug', 'hash'] as const;
}
