/**
 * .what = computes articulation file path for self-review
 * .why = single source of truth for path format, enables consistent file location
 *
 * .note = the path is keyed (stone, slug) — the promise's own key. it carries NO derived
 *         ordinal, because an ordinal is a quantity every call site must derive identically
 *         and three of them did not: findNextUnpromisedReview returned a zero-based indexOf,
 *         setStoneAsPassed passed a one-based position, stepRouteStoneSet passed a count.
 *         so two emits named two different files for one owed review.
 *         a quantity the path does not carry cannot be derived three ways.
 * .note = the driver already holds both operands, so the path is computable by hand.
 */
export const getSelfReviewArticulationPath = (input: {
  route: string;
  stone: string;
  slug: string;
}): string =>
  `${input.route}/review/self/for.${input.stone}._.${input.slug}.md`;
