/**
 * .what = one stance the driver declared, keyed to the concern and given it answered
 * .why = its own file, so the leaf operations that read a stance (the match predicate, the fold
 *        key, the tallies) import the shape without an import back into the ledger reader that
 *        produces it
 *
 * .note = `given` holds the given's filename (`asReviewGivenKey`) on rows written today, and the
 *         absolute path on rows written by bhrain ≤ 0.42.1. every compare goes through
 *         `isReviewAbsorptionOnGiven`, which reads both
 */
export interface ReviewAbsorption {
  status: 'disputed' | 'conceded';
  reviewer: string;
  about: string;
  given: string;
  fulcrum?: string;
  /**
   * the harm grade a CONCESSION carries — `urgent` or `better` (F028/S14)
   *
   * .why = the exhaustion verdict reads it: a budget hit with ≥1 live `urgent` concession
   *        warns the human, where an all-`better` hit is good enough and proceeds with no
   *        human (`define.invariant.review.peer.budget.urgent-earns-budget`).
   * .note = absent on a legacy/ungraded concede, read as `better` (the maintenance floor).
   *         absent on a DISPUTE always — a dispute concedes naught, so it grades naught.
   */
  severity?: 'better' | 'urgent';
}
