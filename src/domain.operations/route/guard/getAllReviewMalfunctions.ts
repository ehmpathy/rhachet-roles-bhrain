/**
 * .what = the review lanes that malfunctioned and are not forgiven
 * .why = names the malfunction gate's lane set, so the passage orchestrator reads it as one
 *        call rather than a compound predicate to simulate
 *        (rule.forbid.decode-friction-in-orchestrators). a malfunction at an overruled level
 *        is forgiven (a human waved it through), so it does not count
 */
export const getAllReviewMalfunctions = <
  TReview extends { exitClass: string; index: number },
>(input: {
  reviews: TReview[];
  isLevelOverruled: (index: number) => boolean;
}): TReview[] =>
  input.reviews.filter(
    (review) =>
      review.exitClass === 'malfunction' &&
      !input.isLevelOverruled(review.index),
  );
