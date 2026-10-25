import { asReviewGivenKey } from './asReviewGivenKey';
import type { ReviewAbsorption } from './ReviewAbsorption';

/**
 * .what = whether a stance answers one reviewer's one given
 * .why = the ONE place the stance↔given match lives. three readers ask it — the live-stance
 *        filter, the undeclared-concern labels, and R3's per-concern lookup — and the match is
 *        the rule most likely to move (it moved once already: raw path → filename key). so it
 *        lands here, and every reader composes it
 *
 * 🔴 the given is compared by `asReviewGivenKey`, never by raw path. the driver and the judge
 *    subprocess spell one given's absolute path two ways (realpath vs symlink), so a raw compare
 *    lapses every stance for the judge alone
 */
export const isReviewAbsorptionOnGiven = (input: {
  absorption: ReviewAbsorption;
  reviewer: string;
  given: string;
}): boolean =>
  input.absorption.reviewer === input.reviewer &&
  asReviewGivenKey({ path: input.absorption.given }) ===
    asReviewGivenKey({ path: input.given });
