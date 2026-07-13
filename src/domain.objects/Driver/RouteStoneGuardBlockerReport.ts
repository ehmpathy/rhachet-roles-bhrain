import { DomainLiteral } from 'domain-objects';

/**
 * .what = the closed set of reasons a stone can be blocked from passage
 * .why = one shared source for the blocker kinds — both this report and
 *        PassageReport.blocker reference it, so a new blocker kind is declared
 *        once and the compiler flags every consumer (no second union to miss)
 *
 * blocker values:
 * - 'review.self': agent needs to promise review.selfs
 * - 'review.peer': peer reviews have blockers (agent can fix)
 * - 'review.peer.exhausted': peer reviewer budget exhausted (needs approval or budget extension)
 * - 'review.peer.uncontemplated': peer reviews await a driver's .taken response (agent can fix)
 * - 'judge': non-approval judges failed (agent can fix)
 * - 'approval': only approval judge blocks (agent must wait for human)
 */
export type RouteStoneGuardBlockerType =
  | 'review.self'
  | 'review.peer'
  | 'review.peer.exhausted'
  | 'review.peer.uncontemplated'
  | 'judge'
  | 'approval';

/**
 * .what = describes why a stone is blocked from passage
 * .why = enables hook mode to determine if agent can stop
 */
export interface RouteStoneGuardBlockerReport {
  /**
   * the stone that is blocked
   */
  stone: string;

  /**
   * what blocks passage
   */
  blocker: RouteStoneGuardBlockerType;

  /**
   * human-readable reason for the block
   */
  reason: string | null;
}

export class RouteStoneGuardBlockerReport
  extends DomainLiteral<RouteStoneGuardBlockerReport>
  implements RouteStoneGuardBlockerReport {}
