/**
 * .what = the guard-assigned identity of one review run — which stone, which round,
 *         which reviewer
 * .why = the meter's whole claim is per-reviewer, per-round, per-stone. a grove total
 *        hides which lane is dear, and that is the only question that matters.
 */
export interface ReviewRunIdentity {
  /**
   * the behavior route this review was driven from (e.g.
   * `.behavior/v2026_09_08.feat-dispute-or-concede-review-budget`), or null when
   * the output path carried no `.reviews/peer` parent to recover it from.
   *
   * .why = `runOneStoneGuardReview` writes into `<route>/.reviews/peer/`, so the
   *        route is the output path's grandparent — the ONLY place the route that
   *        drove a review survives into the log corpus.
   */
  route: string | null;
  /** the stone whose guard ran this review (e.g. `5.1.execution.from_vision`) */
  stone: string;
  /** the guard iteration — the driver's round count for this stone */
  iteration: number;
  /** the artifact hash the guard reviewed at this round */
  hash: string;
  /** the reviewer's index within the guard's declared order */
  index: number;
  /** the reviewer's slug (e.g. `repo-rules`, `mech-failhides`) */
  slug: string;
}
