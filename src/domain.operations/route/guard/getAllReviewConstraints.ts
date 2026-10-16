/**
 * .what = the review lanes that hit a genuine constraint and are not forgiven
 * .why = names the constraint gate's lane set, so the passage orchestrator reads it as one
 *        call rather than a compound predicate to simulate
 *        (rule.forbid.decode-friction-in-orchestrators)
 *
 * .note = exit 2 WITH blockers is a review that completed and found issues, never a
 *         constraint; exit 2 with ZERO blockers is a genuine constraint (e.g., absent api key)
 * .note = a constraint at an overruled level is forgiven (a human waved it through)
 */
export const getAllReviewConstraints = <
  TReview extends { exitClass: string; blockers: number; index: number },
>(input: {
  reviews: TReview[];
  isLevelOverruled: (index: number) => boolean;
}): TReview[] =>
  input.reviews.filter(
    (review) =>
      review.exitClass === 'constraint' &&
      review.blockers === 0 &&
      !input.isLevelOverruled(review.index),
  );
