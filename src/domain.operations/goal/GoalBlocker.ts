import { DomainLiteral } from 'domain-objects';

/**
 * .what = current state of goal stop blocker
 * .why = enables escalation of onStop reminders
 */
export interface GoalBlockerState {
  /**
   * consecutive blocks since last progress
   */
  count: number;

  /**
   * goal slug that triggered the current block streak
   */
  goalSlug: string | null;
}

export class GoalBlockerState
  extends DomainLiteral<GoalBlockerState>
  implements GoalBlockerState {}
