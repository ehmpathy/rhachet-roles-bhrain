import { DomainLiteral } from 'domain-objects';

import type { RouteStoneGuardBlockerType } from './RouteStoneGuardBlockerReport';

/**
 * .what = a report of a stone's passage status in passage.jsonl
 * .why = consolidates all passage markers (passed, approved, blocked, rewound) into one file
 *
 * status values:
 * - 'passed': stone has passed all guards
 * - 'approved': stone has been approved
 * - 'blocked': stone is blocked from passage
 * - 'rewound': stone validation state has been cleared for fresh evaluation
 * - 'malfunction': reviewer or judge malfunctioned (exit code != 0 and != 2)
 * - 'overruled': human bypassed the review threshold for one review level
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
