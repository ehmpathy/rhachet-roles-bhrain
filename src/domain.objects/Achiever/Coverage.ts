import { DomainLiteral } from 'domain-objects';

/**
 * .what = a coverage entry that links an ask hash to a goal
 * .why = ensures no ask is left behind — every ask must be covered by a goal
 */
export interface Coverage {
  /**
   * the ask hash (from Ask.hash)
   */
  hash: string;

  /**
   * the goal slug that covers this ask
   */
  goalSlug: string;

  /**
   * when the coverage was recorded (ISO date string)
   */
  coveredAt: string;
}

export class Coverage extends DomainLiteral<Coverage> implements Coverage {}
