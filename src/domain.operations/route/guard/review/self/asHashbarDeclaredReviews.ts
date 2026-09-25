import type { RouteStoneGuardReviewSelf } from '../../../../../domain.objects/Driver/RouteStoneGuard';

/**
 * .what = the (stone, slug) pairs whose guard still declares the retired `hashbar:` key
 * .why = a `.filter(…).map(…)` at the emit's call site made the reader simulate a pipeline to
 *        learn which reviews the retirement notice names (rule.forbid.inline-decode-friction)
 *
 * .note = the key is ACCEPTED and read ONLY to say so. a throw would halt a route on a key
 *         that was correct when it was written, and silence would let the author carry a dead
 *         key into the next guard. no guard in this repo sets it, so this is empty here and
 *         the notice costs downstream authors alone.
 * .note = the test is `!== undefined`, never truthiness — `hashbar: 0` was the commonest value
 *         in the wild, and it is exactly the author who most needs to hear the key is retired.
 */
export const asHashbarDeclaredReviews = (input: {
  stone: string;
  selfReviews: RouteStoneGuardReviewSelf[];
}): { stone: string; slug: string }[] =>
  input.selfReviews
    .filter((review) => review.hashbar !== undefined)
    .map((review) => ({ stone: input.stone, slug: review.slug }));
