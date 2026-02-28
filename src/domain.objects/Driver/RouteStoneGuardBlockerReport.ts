import { DomainLiteral } from 'domain-objects';

/**
 * .what = describes why a stone is blocked from passage
 * .why = enables hook mode to determine if agent can stop
 *
 * blocker values:
 * - 'review.self': agent needs to promise review.selfs
 * - 'review.peer': peer reviews have blockers (agent can fix)
 * - 'judge': non-approval judges failed (agent can fix)
 * - 'approval': only approval judge blocks (agent must wait for human)
 */
export interface RouteStoneGuardBlockerReport {
  /**
   * the stone that is blocked
   */
  stone: string;

  /**
   * what blocks passage
   */
  blocker: 'review.self' | 'review.peer' | 'judge' | 'approval';

  /**
   * human-readable reason for the block
   */
  reason: string | null;
}

export class RouteStoneGuardBlockerReport
  extends DomainLiteral<RouteStoneGuardBlockerReport>
  implements RouteStoneGuardBlockerReport {}
