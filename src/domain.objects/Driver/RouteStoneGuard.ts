import { DomainLiteral } from 'domain-objects';

/**
 * .what = represents the conditions to pass a guarded stone
 * .why = enables configurable validation before milestone passage
 */
export interface RouteStoneGuard {
  /**
   * path to the .guard file
   */
  path: string;

  /**
   * glob patterns for artifact detection
   */
  artifacts: string[];

  /**
   * shell commands to run reviews
   *
   * each command produces a review artifact under .route/
   */
  reviews: string[];

  /**
   * shell commands to run judges
   *
   * each command produces a judge artifact under .route/
   */
  judges: string[];
}

export class RouteStoneGuard
  extends DomainLiteral<RouteStoneGuard>
  implements RouteStoneGuard {}
