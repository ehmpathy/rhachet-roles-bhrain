import { asReviewGivenKey } from './asReviewGivenKey';
import type { ReviewAbsorption } from './ReviewAbsorption';

/**
 * .what = the identity of a stance — `(reviewer, about, given key)` — as one string
 * .why = the ledger fold keeps the LAST stance per identity. the given part keys by
 *        `asReviewGivenKey`, so a legacy absolute row and a filename row on the same concern
 *        of the same given fold to one stance
 */
export const asReviewAbsorptionKey = (input: {
  absorption: ReviewAbsorption;
}): string =>
  [
    input.absorption.reviewer,
    input.absorption.about,
    asReviewGivenKey({ path: input.absorption.given }),
  ].join('::');
