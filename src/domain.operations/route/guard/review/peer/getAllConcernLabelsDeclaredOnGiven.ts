import type { ReviewAbsorption } from './getStoneReviewAbsorptions';
import { isReviewAbsorptionOnGiven } from './isReviewAbsorptionOnGiven';

/**
 * .what = the concern labels a stance already covers, on one reviewer's one given
 * .why = the undeclared-concern question subtracts these from the labels the given raised;
 *        named so that caller reads as intent, with the match itself in
 *        `isReviewAbsorptionOnGiven`
 */
export const getAllConcernLabelsDeclaredOnGiven = (input: {
  absorptions: ReviewAbsorption[];
  reviewer: string;
  given: string;
}): string[] =>
  input.absorptions
    .filter((absorption) =>
      isReviewAbsorptionOnGiven({
        absorption,
        reviewer: input.reviewer,
        given: input.given,
      }),
    )
    .map((absorption) => absorption.about);
