import { DomainLiteral } from 'domain-objects';
import type { PickOne } from 'type-fns';

/**
 * .what = status choices for a goal
 * .why = explicit state machine for goal lifecycle
 *
 * incomplete → enqueued → inflight → fulfilled
 *                  ↓
 *              blocked
 */
export type GoalStatusChoice =
  | 'incomplete'
  | 'blocked'
  | 'enqueued'
  | 'inflight'
  | 'fulfilled';

/**
 * .what = array of valid status choices for runtime validation
 * .why = enables fail-fast on invalid status values in CLI
 */
export const GOAL_STATUS_CHOICES: GoalStatusChoice[] = [
  'incomplete',
  'blocked',
  'enqueued',
  'inflight',
  'fulfilled',
];

/**
 * .what = source of the goal
 * .why = distinguishes peer asks from self-generated goals
 */
export type GoalSource = 'peer:human' | 'peer:robot' | 'self';

/**
 * .what = the motivation behind a goal
 * .why = forces articulation of why this goal matters
 */
export interface GoalWhy {
  /**
   * what was said (verbatim or summarized)
   */
  ask: string;

  /**
   * the motivation behind the ask
   */
  purpose: string;

  /**
   * what success enables
   */
  benefit: string;
}

export class GoalWhy extends DomainLiteral<GoalWhy> implements GoalWhy {}

/**
 * .what = the vision of a goal
 * .why = forces articulation of the desired end state
 */
export interface GoalWhat {
  /**
   * the desired end state
   */
  outcome: string;
}

export class GoalWhat extends DomainLiteral<GoalWhat> implements GoalWhat {}

/**
 * .what = the path to achieve a goal
 * .why = forces articulation of approach and verification
 */
export interface GoalHow {
  /**
   * actionable approach and next step
   */
  task: string;

  /**
   * how to verify completion
   */
  gate: string;
}

export class GoalHow extends DomainLiteral<GoalHow> implements GoalHow {}

/**
 * .what = the current status of a goal
 * .why = tracks lifecycle state with reason
 */
export interface GoalStatus {
  /**
   * the current state
   */
  choice: GoalStatusChoice;

  /**
   * why this status (verification evidence for fulfilled, blocker for blocked)
   */
  reason: string;
}

export class GoalStatus
  extends DomainLiteral<GoalStatus>
  implements GoalStatus {}

/**
 * .what = what the goal is blocked on (only for status.choice = 'blocked')
 * .why = makes dependencies explicit
 */
export interface GoalWhen {
  /**
   * blocked until this goal is fulfilled
   */
  goal?: string;

  /**
   * blocked on external event
   */
  event?: string;
}

export class GoalWhen extends DomainLiteral<GoalWhen> implements GoalWhen {}

/**
 * .what = completeness metadata for a goal
 * .why = enables partial goals with triage reminders
 */
export interface GoalMeta {
  /**
   * true if all required fields are present
   */
  complete: boolean;

  /**
   * list of absent required fields (e.g., ['why.purpose', 'how.gate'])
   */
  absent: string[];
}

export class GoalMeta extends DomainLiteral<GoalMeta> implements GoalMeta {}

/**
 * .what = required fields for a complete goal
 * .why = defines what "complete" means
 */
export const GOAL_REQUIRED_FIELDS = [
  'why.ask',
  'why.purpose',
  'why.benefit',
  'what.outcome',
  'how.task',
  'how.gate',
] as const;

/**
 * .what = computes completeness of a goal
 * .why = determines which fields are absent for triage reminders
 */
export const computeGoalCompleteness = (goal: {
  why?: Partial<GoalWhy>;
  what?: Partial<GoalWhat>;
  how?: Partial<GoalHow>;
}): GoalMeta => {
  const absent: string[] = [];

  // check why fields
  if (!goal.why?.ask) absent.push('why.ask');
  if (!goal.why?.purpose) absent.push('why.purpose');
  if (!goal.why?.benefit) absent.push('why.benefit');

  // check what fields
  if (!goal.what?.outcome) absent.push('what.outcome');

  // check how fields
  if (!goal.how?.task) absent.push('how.task');
  if (!goal.how?.gate) absent.push('how.gate');

  return new GoalMeta({
    complete: absent.length === 0,
    absent,
  });
};

/**
 * .what = a goal that forces foresight
 * .why = structure unlocks clarity — each field forces a distinct thought
 * .note = fields are optional to support partial goals for quick capture
 */
export interface Goal {
  /**
   * unique identifier for the goal (required, even for partial goals)
   */
  slug: string;

  /**
   * the motivation (ask, purpose, benefit)
   * optional for partial goals — triage will remind to complete
   */
  why?: Partial<GoalWhy>;

  /**
   * the vision (outcome)
   * optional for partial goals — triage will remind to complete
   */
  what?: Partial<GoalWhat>;

  /**
   * the path (task, gate)
   * optional for partial goals — triage will remind to complete
   */
  how?: Partial<GoalHow>;

  /**
   * the current state (choice, reason)
   */
  status: GoalStatus;

  /**
   * what the goal is blocked on (only for status.choice = 'blocked')
   * mutually exclusive: either goal or event, not both
   */
  when?: PickOne<GoalWhen>;

  /**
   * who originated this goal
   */
  source: GoalSource;

  /**
   * when the goal was created
   */
  createdAt: string;

  /**
   * when the goal was last updated
   */
  updatedAt: string;
}

export class Goal extends DomainLiteral<Goal> implements Goal {
  public static nested = {
    why: GoalWhy,
    what: GoalWhat,
    how: GoalHow,
    status: GoalStatus,
    when: GoalWhen,
  };
}
