import { DomainLiteral } from 'domain-objects';
import type { IsoDuration } from 'iso-time';

/**
 * .what = represents a review.self prompt for the clone
 * .why = enables explicit self-check before peer review
 */
export interface RouteStoneGuardReviewSelf {
  /**
   * identifier for the review.self (used in --as promised --that $slug)
   */
  slug: string;

  /**
   * guide content: inline text or @path/to/brief.md reference
   */
  say: string;

  /**
   * number of hash changes before promise becomes hashless (default: 3)
   *
   * after count > hashbar, the promise becomes a firm checkpoint
   * that won't invalidate on future hash changes
   */
  hashbar?: number;
}

/**
 * .what = structured peer review with budget and level
 * .why = enables external validation with consumption limits and execution order
 */
export interface RouteStoneGuardReviewPeer {
  /**
   * identifier for the peer review
   */
  slug: string;

  /**
   * shell command to run the review
   */
  run: string;

  /**
   * number of rounds budgeted for this reviewer
   *
   * each successful review invocation consumes one round.
   * when rounds consumed >= budget, verdict becomes 'exhausted'.
   */
  budget: number;

  /**
   * execution level (default: 1)
   *
   * higher levels run first. level N-1 reviewers wait until
   * all level N reviewers are terminal (approved | exhausted).
   */
  level?: number;

  /**
   * timeout for review command execution (default: "PT21M")
   *
   * ISO 8601 duration format. examples:
   * - "PT90S" = 90 seconds
   * - "PT2M" = 2 minutes
   * - "PT21M" = 21 minutes (default)
   */
  timeout?: IsoDuration;
}

export class RouteStoneGuardReviewPeer
  extends DomainLiteral<RouteStoneGuardReviewPeer>
  implements RouteStoneGuardReviewPeer
{
  public static unique = ['slug'] as const;
}

/**
 * .what = legacy peer review as raw shell command string
 * .why = backwards compat for migration to structured format
 *
 * .note = deprecated: use RouteStoneGuardReviewPeer structured format
 */
export type RouteStoneGuardReviewPeerLegacy = string;

/**
 * .what = peer review in any supported format
 * .why = allows incremental migration from string to structured
 */
export type RouteStoneGuardReviewPeerAny =
  | RouteStoneGuardReviewPeer
  | RouteStoneGuardReviewPeerLegacy;

/**
 * .what = extracts run command from peer review
 * .why = accessor for run command
 */
export const getReviewPeerRunCmd = (
  review: RouteStoneGuardReviewPeer,
): string => review.run;

/**
 * .what = structured reviews with self and/or peer sections
 * .why = enables self-check before peer review
 *
 * .note = at least one of self or peer must be present
 * .note = all reviews are structured; legacy strings converted at parse time
 */
export interface RouteStoneGuardReviewsStructured {
  self?: RouteStoneGuardReviewSelf[];
  peer?: RouteStoneGuardReviewPeer[];
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
   * structured object with self and peer sections
   * .note = legacy flat array format converted to structured at parse time
   *
   * each peer command produces a review artifact under .route/
   */
  reviews: RouteStoneGuardReviewsStructured;

  /**
   * shell commands to run judges
   *
   * each command produces a judge artifact under .route/
   */
  judges: string[];

  /**
   * glob patterns for protected artifacts
   *
   * writes to matched paths are blocked until this stone passes
   */
  protect: string[];
}

export class RouteStoneGuard
  extends DomainLiteral<RouteStoneGuard>
  implements RouteStoneGuard {}

/**
 * .what = extracts peer reviews from guard.reviews
 * .why = accessor for peer reviews
 */
export const getGuardPeerReviews = (
  guard: RouteStoneGuard,
): RouteStoneGuardReviewPeer[] => {
  return guard.reviews.peer ?? [];
};

/**
 * .what = extracts self reviews from guard.reviews
 * .why = accessor for self reviews
 */
export const getGuardSelfReviews = (
  guard: RouteStoneGuard,
): RouteStoneGuardReviewSelf[] => {
  return guard.reviews.self ?? [];
};
