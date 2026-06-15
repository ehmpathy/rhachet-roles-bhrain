/**
 * .what = derives verdict from meter state and review outcome
 * .why = single source of truth for verdict computation
 *
 * uses same threshold logic as guard's reviewed? judge:
 * - malfunction: exitClass === 'malfunction' (review process failed)
 * - approved: blockers <= allowBlockers AND nitpicks <= allowNitpicks
 * - rejected: blockers > allowBlockers OR nitpicks > allowNitpicks
 * - exhausted: review was SKIPPED because budget was already spent
 *
 * invariant: a review can only be 'exhausted' if it was SKIPPED.
 * if a review RAN (even if it depleted the budget), it is 'rejected', not 'exhausted'.
 * see: define.invariant.review.peer.exhausted
 */

export type ReviewPeerVerdict =
  | 'queued'
  | 'rejected'
  | 'approved'
  | 'exhausted'
  | 'malfunction';

export const computeReviewPeerVerdict = (input: {
  rounds: number;
  budget: number;
  blockers: number;
  nitpicks?: number;
  allowBlockers?: number;
  allowNitpicks?: number;
  /** review exit class - if malfunction, verdict is malfunction regardless of blockers */
  exitClass?: 'passed' | 'constraint' | 'malfunction';
  /**
   * whether the review was skipped (not run) due to budget exhaustion
   * .why = 'exhausted' verdict only applies when review was SKIPPED
   * .note = true = pre-run check when rounds >= budget (will skip)
   *         false = post-run (review ran, even if it depleted budget)
   */
  wasExhausted?: boolean;
}): ReviewPeerVerdict => {
  // malfunction takes precedence over all other checks
  // .why = review process failed, blockers/nitpicks are not meaningful
  if (input.exitClass === 'malfunction') return 'malfunction';

  // defaults match reviewed? judge defaults
  const allowBlockers = input.allowBlockers ?? 0;
  const allowNitpicks = input.allowNitpicks ?? 0;
  const nitpicks = input.nitpicks ?? 0;

  // not yet reviewed (no rounds AND no blocker data from cached review)
  // note: blockers === Infinity means no cached review exists
  if (input.rounds === 0 && input.blockers === Infinity) return 'queued';

  // check thresholds (same logic as computeReviewThresholdVerdict)
  const passesThresholds =
    input.blockers <= allowBlockers && nitpicks <= allowNitpicks;

  // review passed thresholds
  if (passesThresholds) return 'approved';

  // review was skipped due to budget exhaustion
  // .invariant = wasExhausted can only be true when rounds >= budget
  if (input.wasExhausted === true) return 'exhausted';

  // reviewer rejected (thresholds not met)
  // .note = even if rounds >= budget, if review RAN, verdict is 'rejected'
  return 'rejected';
};
