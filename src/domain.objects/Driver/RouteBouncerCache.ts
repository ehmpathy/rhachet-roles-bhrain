import { DomainLiteral } from 'domain-objects';

import { RouteBouncerProtection } from './RouteBouncerProtection';

/**
 * .what = precomputed cache of artifact protections for a route
 * .why = enables fast lookup at Write/Edit tool invocation
 */
export interface RouteBouncerCache {
  /**
   * protections declared by this route's guards
   */
  protections: RouteBouncerProtection[];
}

export class RouteBouncerCache
  extends DomainLiteral<RouteBouncerCache>
  implements RouteBouncerCache
{
  public static nested = { protections: RouteBouncerProtection };
}
