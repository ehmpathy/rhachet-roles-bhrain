import type { RouteStone } from './RouteStone';

/**
 * .what = represents a progress event from a guard review or judge
 * .why = enables live cli feedback about guard execution status
 *
 * .note = lifecycle state via field presence:
 *   - both inflight and outcome null = cached
 *   - inflight present + outcome null = active
 *   - outcome present = done
 */
export interface GuardProgressEvent {
  /**
   * the stone under guard evaluation
   *
   * carries .name, .guard, .path — the cmd is derived via
   * stone.guard.reviews[step.index] or stone.guard.judges[step.index]
   */
  stone: RouteStone;

  /**
   * which guard step is active
   *
   * phase + index identify the cmd via stone.guard
   */
  step: {
    phase: 'review' | 'judge';
    index: number;
  };

  /**
   * reviewer metadata (for review phase only)
   *
   * enables display of full slug, level, budget, rounds in progress output
   */
  reviewer?: {
    index: number;
    slug: string;
    level: number;
    budget: number;
    rounds: number;
  };

  /**
   * lifecycle timestamps (null when cached)
   *
   * endedAt is null while active, populated on finish
   */
  inflight: {
    beganAt: string;
    endedAt: string | null;
  } | null;

  /**
   * result data (null while active or cached; populated on finish)
   */
  outcome: {
    /**
     * path to review/judge artifact (null for skipped states)
     */
    path: string | null;
    review:
      | { blockers: number; nitpicks: number }
      | { malfunction: Error }
      | { constraint: Error }
      | { exhausted: true; blockers: number; nitpicks: number }
      | { queued: true }
      | null;
    judge:
      | { decision: 'allowed' | 'blocked'; reason: string | null }
      | { malfunction: Error }
      | null;
  } | null;
}
