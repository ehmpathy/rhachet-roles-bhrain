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
 * - 'review.peer.exhausted': LEGACY, read-only. no current write path emits this — an
 *   exhausted peer budget is now recorded as its OWN passage status ('exhausted'), not a
 *   blocker (see setStoneAsPassed). the member survives only so readers can interpret old
 *   passage.jsonl rows written before the status split; do NOT write it on a new path.
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
   * what blocks passage — null for a driver wall (--as blocked with no guard blocker)
   *
   * .why = a driver-initiated wall has NO guard blocker kind; it is not a judge
   *        failure. null states "blocked, but by no guard gate" truthfully, as a mirror
   *        of PassageReport.blocker's absence. never fabricate a 'judge' here.
   */
  blocker: RouteStoneGuardBlockerType | null;

  /**
   * human-readable reason for the block
   */
  reason: string | null;
}

export class RouteStoneGuardBlockerReport
  extends DomainLiteral<RouteStoneGuardBlockerReport>
  implements RouteStoneGuardBlockerReport {}
