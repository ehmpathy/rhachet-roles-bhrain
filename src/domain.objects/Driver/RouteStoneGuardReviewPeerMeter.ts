import { DomainLiteral } from 'domain-objects';

/**
 * .what = tracks rounds consumed by a peer reviewer per stone
 * .why = enables budget enforcement per reviewer per stone
 */
export interface RouteStoneGuardReviewPeerMeter {
  /**
   * stone name this meter applies to
   *
   * budget is per-stone, not per-route
   */
  stone: string;

  /**
   * reference to the reviewer by slug
   *
   * matches RouteStoneGuardReviewPeer.slug
   */
  reviewer: { slug: string };

  /**
   * number of review rounds consumed
   *
   * increments on each successful review invocation.
   * when rounds >= reviewer.budget, verdict becomes 'exhausted'.
   */
  rounds: number;
}

export class RouteStoneGuardReviewPeerMeter
  extends DomainLiteral<RouteStoneGuardReviewPeerMeter>
  implements RouteStoneGuardReviewPeerMeter
{
  public static unique = ['stone', 'reviewer'] as const;
}
