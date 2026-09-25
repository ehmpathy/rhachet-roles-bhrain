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
   * @deprecated retired — the trigger report is hashless, so a repair resets no clock
   *
   * .what = it declared how many hash changes to tolerate before a promise went hashless
   * .why it is retired = the trigger report was keyed on the artifact hash, so every repair
   *      minted a fresh report with the clock at now. `hashbar` was the workaround for
   *      exactly that, and the defect is now gone at the root: the key is (stone, slug).
   * .note = it never delivered its documented behavior at ANY value. the persist branch
   *         measured elapsed against the NEWEST trigger, and a fresh hash mints its marker
   *         at now — so it was instantly the newest and the branch re-read its own creation.
   *         ⇒ no caller can depend on a behavior the code did not implement.
   * .note = the key is still ACCEPTED, and it is read only to say so. a throw would halt a
   *         route on a key that was correct when it was written; silence would let the author
   *         carry a dead key into the next guard. one line is the kind path.
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
   * LOWER levels run first — cheap before expensive. level N reviewers wait
   * until all level N-1 reviewers are terminal (approved | exhausted |
   * malfunction | constraint).
   *
   * .note = within one level, reviewers run CONCURRENTLY. the bound is per
   *         concurrency group — see `group:` below and `reviews.groups`.
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

  /**
   * the concurrency group this reviewer belongs to (default: its own)
   *
   * a concurrency group is a set of reviewers that contend for ONE resource —
   * a provider's ratelimit, a host's memory, a service's connection cap.
   *
   * .why = membership is knowledge only the guard's author holds. no tool can
   *        infer which two reviewers call the same provider.
   *
   * .note = MEMBERSHIP lives here; the BOUND lives on the group, in
   *         `reviews.groups`. two facts, two homes — a bound is a cardinality,
   *         which describes the set, never any one member.
   *
   * 🔴 .hazard = AN OMISSION HERE IS SILENT, AND IT DEFEATS THE VALVE.
   *         a reviewer added beside a bounded group, whose author forgot this
   *         key, joins no group — so it pours at the level's own default and
   *         runs ALONGSIDE the member the bound held back. a group declared
   *         `concurrency: 1` then puts two calls on the provider at once.
   *
   *         ⚠️ and no tool can catch it. the parser refuses a group nobody
   *         joined, and a group with no bound, because both are decidable from
   *         the file alone. this one is not: a level that mixes grouped and
   *         ungrouped reviewers is LEGITIMATE whenever the ungrouped ones touch
   *         a different resource, and only the author knows whether they do —
   *         the same fact that put membership on the reviewer to begin with.
   *
   *         ⇒ so the check is the author's, at the moment a reviewer joins a
   *         level that already carries a group: *does this one share that
   *         group's resource?* if yes, name the group. raised i003/r011 point A
   */
  group?: string;
}

/**
 * .what = the bound on a concurrency group — how many of its members run at once
 * .why = a bound is a property of a SET. "this reviewer has concurrency 10"
 *        states no fact, because 10 of *what set*?
 */
export interface RouteStoneGuardReviewGroup {
  /**
   * how many members of this group may be in flight at once
   */
  concurrency: number;
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

  /**
   * the bound per concurrency group, keyed by group name
   *
   * ⚠️ membership is declared on the REVIEWER (`group:`); the bound is declared
   *    here. a reviewer that names no group contends with nobody.
   *
   * .note = declare membership IN PLACE. a `.guard` file is not in the hashed
   *         artifact set, so an edit here does not move the artifact hash and
   *         every cached lane stays live — but a REORDER of `peer` shifts every
   *         later index and discards those caches, at one budget round each.
   *
   * 🔴 .note = a group bound is the SECOND of two bounds a lane passes. every
   *         lane also passes the LEVEL's own bound, which no `.guard` key sets
   *         — it defaults to 10 and is overridable per run with
   *         `RHACHET_LEVEL_CONCURRENCY`. so a group at `concurrency: 20` still
   *         pours at most 10 at once, and this key can only ever narrow.
   *
   *         ⚠️ the level bound is deliberately NOT a `.guard` key: it is an
   *         operator dial over a review-scope decision, so it moves with no
   *         code edit and no snapshot re-baseline while fulcrum F2's value is
   *         open. it is stated here because a guard author who reads only this
   *         key would take a group bound for the whole story. raised i009/r10,
   *         table row 4 — *"undocumented outside source/comments"*
   */
  groups?: Record<string, RouteStoneGuardReviewGroup>;
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
