/**
 * .what = derives verdict from meter state and review outcome
 * .why = single source of truth for verdict computation
 */

export type ReviewPeerVerdict =
  | 'queued'
  | 'rejected'
  | 'approved'
  | 'exhausted';

export const computeReviewPeerVerdict = (input: {
  rounds: number;
  budget: number;
  blockers: number;
}): ReviewPeerVerdict => {
  // review passed (no blockers)
  if (input.blockers === 0) return 'approved';

  // not yet reviewed (no rounds AND no blocker data from cached review)
  // note: blockers === Infinity means no cached review exists
  if (input.rounds === 0 && input.blockers === Infinity) return 'queued';

  // budget exhausted with blockers left
  if (input.rounds >= input.budget) return 'exhausted';

  // reviewer rejected (has blockers) but budget remains
  return 'rejected';
};
