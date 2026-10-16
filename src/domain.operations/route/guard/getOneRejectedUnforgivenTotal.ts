/**
 * .what = counts the reviewers that rejected and still await an answer
 * .why = a malfunction is often partial; the driver must hear that the lanes which did
 *        run and reject are owed answers too. a broken lane is not a rejection, and a
 *        lane at an overruled level is forgiven, so neither counts
 */
export const getOneRejectedUnforgivenTotal = (input: {
  reviews: { exitClass: string; blockers: number; index: number }[];
  isLevelOverruled: (index: number) => boolean;
}): number =>
  input.reviews.filter(
    (review) =>
      review.exitClass !== 'malfunction' &&
      review.blockers > 0 &&
      !input.isLevelOverruled(review.index),
  ).length;
