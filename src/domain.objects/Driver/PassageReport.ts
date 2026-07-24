import { DomainLiteral } from 'domain-objects';

import type { RouteStoneGuardBlockerType } from './RouteStoneGuardBlockerReport';

/**
 * .what = a report of a stone's passage status in passage.jsonl
 * .why = consolidates all passage markers (passed, approved, blocked, rewound) into one file
 *
 * status values:
 * - 'passed': stone has passed all guards
 * - 'approved': stone has been approved
 * - 'blocked': stone is blocked from passage by a hard driver wall (--as blocked)
 * - 'exhausted': peer-review budget is spent; a human must approve or extend
 * - 'arrived': driver entered the guard's reviews — in flight (push)
 * - 'promised': driver promised a self-review — forward motion (push)
 * - 'contemplated': driver contemplated a peer review — forward motion (push)
 * - 'rewound': stone validation state has been cleared for fresh evaluation
 * - 'malfunction': reviewer or judge malfunctioned (exit code != 0 and != 2)
 * - 'overruled': human bypassed the review threshold for one review level
 *
 * .note = 'arrived', 'promised', and 'contemplated' are review-flow markers. they
 *         record forward motion so that a prior blocker clears (latest-entry-wins) —
 *         see rule.require.forward-motion-clears-blocker. 'arrived' is written on
 *         ENTRY to the guard (before the reviews run) so a stale halt clears at once,
 *         not after. they are NOT passage (only 'passed' is); their disposition is
 *         push (the machine's own review work).
 */
export interface PassageReport {
  /**
   * the stone this report is for
   */
  stone: string;

  /**
   * the passage status
   */
  status:
    | 'passed'
    | 'approved'
    | 'blocked'
    | 'exhausted'
    | 'arrived'
    | 'promised'
    | 'contemplated'
    | 'rewound'
    | 'malfunction'
    | 'overruled';

  /**
   * what blocks passage (only for status='blocked')
   */
  blocker?: RouteStoneGuardBlockerType;

  /**
   * the review level this report scopes to (only for status='overruled')
   *
   * .why = overrule is level-scoped: an overrule with level=N forgives the
   *        blockers of reviewers at level N only, so higher levels still run.
   * .note = absent on legacy overrule rows (pre-level-scope); absent treated
   *         as "all levels" for backward compatibility.
   */
  level?: number;

  /**
   * human-readable reason (optional)
   */
  reason?: string;
}

export class PassageReport
  extends DomainLiteral<PassageReport>
  implements PassageReport {}
