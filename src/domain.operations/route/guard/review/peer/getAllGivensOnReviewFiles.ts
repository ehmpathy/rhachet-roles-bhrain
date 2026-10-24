import { asReviewGivenKey } from './asReviewGivenKey';
import type { RouteGuardReviewPeerGiven } from './getAllRouteGuardReviewPeerGivens';

/**
 * .what = keeps only the givens whose file is among the review files the judge counts
 * .why = a stance is live only against a given in the list it is read with. the judge counts the
 *        review files of non-overruled levels; a stance read against EVERY given would shed from a
 *        lane whose blockers were never in the total — so a stance on an overruled lane offset a
 *        live lane's blockers, and the stone passed on concerns no one answered. narrow the givens
 *        to the counted files, and a stance can only shed what its own lane put in the sum.
 *
 * .note = the compare runs through `asReviewGivenKey`, the one given identity, so a counted file
 *         and a given name the same review whatever directory each was read through
 */
export const getAllGivensOnReviewFiles = (input: {
  givens: RouteGuardReviewPeerGiven[];
  reviewFiles: string[];
}): RouteGuardReviewPeerGiven[] => {
  const keysCounted = new Set(
    input.reviewFiles.map((file) => asReviewGivenKey({ path: file })),
  );
  return input.givens.filter((given) =>
    keysCounted.has(asReviewGivenKey({ path: given.pathGiven })),
  );
};
