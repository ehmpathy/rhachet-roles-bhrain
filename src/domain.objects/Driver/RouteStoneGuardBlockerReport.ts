import { DomainLiteral } from 'domain-objects';

/**
 * .what = describes why a stone is blocked from passage
 * .why = enables hook mode to determine if agent can stop
 *
 * blockedOn values:
 * - 'self-review': agent needs to promise self-reviews
 * - 'review': peer reviews have blockers (agent can fix)
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
  blockedOn: 'self-review' | 'review' | 'judge' | 'approval';

  /**
   * human-readable reason for the block
   */
  reason: string | null;
}

export class RouteStoneGuardBlockerReport
  extends DomainLiteral<RouteStoneGuardBlockerReport>
  implements RouteStoneGuardBlockerReport {}
