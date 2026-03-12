import { DomainLiteral } from 'domain-objects';

/**
 * .what = represents a single artifact protection from a guard
 * .why = enables us to track which globs are protected by which stones
 */
export interface RouteBouncerProtection {
  /**
   * glob pattern for protected artifacts
   */
  glob: string;

  /**
   * stone name that declares this protection
   */
  stone: string;

  /**
   * path to the guard file that declares this protection
   */
  guard: string;

  /**
   * path to the route directory
   */
  route: string;

  /**
   * whether the stone has passed
   */
  passed: boolean;
}

export class RouteBouncerProtection
  extends DomainLiteral<RouteBouncerProtection>
  implements RouteBouncerProtection {}
