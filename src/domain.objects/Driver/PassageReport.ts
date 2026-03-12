import { DomainLiteral } from 'domain-objects';

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
 */
export interface PassageReport {
  /**
   * the stone this report is for
   */
  stone: string;

  /**
   * the passage status
   */
  status: 'passed' | 'approved' | 'blocked' | 'rewound' | 'malfunction';

  /**
   * what blocks passage (only for status='blocked')
   */
  blocker?: 'review.self' | 'review.peer' | 'judge' | 'approval';

  /**
   * human-readable reason (optional)
   */
  reason?: string;
}

export class PassageReport
  extends DomainLiteral<PassageReport>
  implements PassageReport {}
