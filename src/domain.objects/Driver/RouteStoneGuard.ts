import { DomainLiteral } from 'domain-objects';

/**
 * .what = represents a self-review prompt for the clone
 * .why = enables explicit self-check before peer review
 */
export interface RouteStoneGuardReviewSelf {
  /**
   * identifier for the self-review (used in --as promised --that $slug)
   */
  slug: string;

  /**
   * guide content: inline text or @path/to/brief.md reference
   */
  say: string;
}

/**
 * .what = shell command for peer review
 * .why = enables external validation of artifacts
 */
export type RouteStoneGuardReviewPeer = string;

/**
 * .what = structured reviews with self and peer sections
 * .why = enables self-check before peer review
 */
export interface RouteStoneGuardReviewsStructured {
  self: RouteStoneGuardReviewSelf[];
  peer: RouteStoneGuardReviewPeer[];
}

/**
 * .what = represents the conditions to pass a guarded stone
 * .why = enables configurable validation before milestone passage
 */
export interface RouteStoneGuard {
  /**
   * path to the .guard file
   */
  path: string;

  /**
   * glob patterns for artifact detection
   */
  artifacts: string[];

  /**
   * shell commands to run reviews
   *
   * flat array (backwards compat) or structured object with self and peer
   *
   * each peer command produces a review artifact under .route/
   */
  reviews: RouteStoneGuardReviewPeer[] | RouteStoneGuardReviewsStructured;

  /**
   * shell commands to run judges
   *
   * each command produces a judge artifact under .route/
   */
  judges: string[];
}

export class RouteStoneGuard
  extends DomainLiteral<RouteStoneGuard>
  implements RouteStoneGuard {}

/**
 * .what = check if reviews is structured format
 * .why = enables type guard for structured reviews
 */
export const isReviewsStructured = (
  reviews: RouteStoneGuardReviewPeer[] | RouteStoneGuardReviewsStructured,
): reviews is RouteStoneGuardReviewsStructured => {
  return (
    !Array.isArray(reviews) &&
    typeof reviews === 'object' &&
    reviews !== null &&
    'self' in reviews &&
    'peer' in reviews
  );
};

/**
 * .what = extracts peer reviews from guard.reviews
 * .why = provides backwards compatible access to peer reviews
 */
export const getGuardPeerReviews = (
  guard: RouteStoneGuard,
): RouteStoneGuardReviewPeer[] => {
  if (isReviewsStructured(guard.reviews)) {
    return guard.reviews.peer;
  }
  return guard.reviews;
};

/**
 * .what = extracts self reviews from guard.reviews
 * .why = provides access to self reviews when defined
 */
export const getGuardSelfReviews = (
  guard: RouteStoneGuard,
): RouteStoneGuardReviewSelf[] => {
  if (isReviewsStructured(guard.reviews)) {
    return guard.reviews.self;
  }
  return [];
};
