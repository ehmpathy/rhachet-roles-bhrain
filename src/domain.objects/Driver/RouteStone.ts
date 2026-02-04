import { DomainEntity } from 'domain-objects';

import type { RouteStoneGuard } from './RouteStoneGuard';

/**
 * .what = represents a milestone on a thought route
 * .why = enables robot navigation through structured thought sequences
 */
export interface RouteStone {
  /**
   * name of the stone without extension
   *
   * e.g., "1.vision", "3.1.research.domain"
   */
  name: string;

  /**
   * path to the .stone or .src file
   */
  path: string;

  /**
   * parsed guard if present, null otherwise
   */
  guard: RouteStoneGuard | null;
}

export class RouteStone extends DomainEntity<RouteStone> implements RouteStone {
  public static unique = ['path'] as const;
}
