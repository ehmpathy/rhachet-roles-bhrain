import type { RouteStoneGuardReviewSelf } from '@src/domain.objects/Driver/RouteStoneGuard';

/**
 * .what = whether a self review has been promised
 * .why = "is this review still owed?" is ONE domain fact, and it had three independent
 *        derivations: a `.filter(!has)` in setStoneAsPassed, a `.find(!has)` in
 *        findNextUnpromisedReview, and a `.filter(has)` in computePromisedReviewCount.
 *        each was correct; none was bound to the others, so the definition could grow an
 *        exception (a disputed promise, a stance) in one and not the rest
 *
 * .note = 🔴 the single source of truth for this predicate, so no call site can derive it
 *         differently. state the POSITIVE and negate at the call site — one boolean, one
 *         sense, no `isNotX` twin for a reader to reconcile
 *
 * ⚠️ .note = this is what makes setStoneAsPassed's `findNextUnpromisedReview(...)!` sound.
 *            before it, that non-null rested on a COMMENT that claimed two derivations scan
 *            alike — "an agreement no type holds". now they cannot disagree, because there is
 *            one predicate for both to read
 */
export const isSelfReviewPromised = (input: {
  review: RouteStoneGuardReviewSelf;
  promisedSlugs: Set<string>;
}): boolean => input.promisedSlugs.has(input.review.slug);
