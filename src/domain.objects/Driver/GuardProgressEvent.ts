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
    path: string;
    review: { blockers: number; nitpicks: number } | null;
    judge: { decision: 'passed' | 'failed'; reason: string | null } | null;
  } | null;
}
