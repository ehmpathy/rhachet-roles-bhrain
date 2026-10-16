import type { RouteStoneGuardReviewArtifact } from '@src/domain.objects/Driver/RouteStoneGuardReviewArtifact';

import { asPeerReviewSlugFromPath } from './asPeerReviewSlugFromPath';
import { asSanitizedPeerReviewSlug } from './asSanitizedPeerReviewSlug';
import { isLaterByIterationThenPath } from './isLaterByIterationThenPath';

/**
 * .what = the cached review at a reviewer's rung, but only when that cache was minted by
 *         THAT reviewer. null on any mismatch
 * .why = the cache is keyed by guard-list POSITION and the meter by SLUG, so the two
 *        halves of one reviewer's state can come from two different reviewers. this
 *        reconciles them at the READ, without a change to the stored artifact
 *
 * 🔴 .note = the direction that ships silently is a FALSE GREEN. the caller's reuse
 *         branch skips a round outright when the cache reads `0 blockers`, so a stricter
 *         reviewer enrolled at a rung whose predecessor approved is never run and is
 *         reported approved. it never speaks; the stone passes on a verdict it never
 *         gave (rule.forbid.failhide).
 *
 *         the reachable sequence is the SANCTIONED one, which is what makes it worth a
 *         guard rather than a dream: run a round, edit the guard's peer list to narrow an
 *         overflowed lane's bind, re-run. a `.guard` file is not in the hashed artifact
 *         set, so that edit does not move the artifact hash and every cache stays live.
 *
 * 🟡 an INSERT is worse than a swap and far easier to do unnoticed, because you remove
 *    no one — it shifts every later lane by one at once.
 *
 * 🟡 it fails safe by construction. a discarded cache costs one budget round, which is
 *    the correct price for a rung whose tenant changed. a reused wrong one cannot be
 *    detected downstream at all.
 *
 * the structural cure keys the cache on the slug itself, rather than a reconciliation at
 *    each read. that needs a `slug` field on the artifact, a writer
 *    change, a reader change with back-compat, and a stamp-format migration, since the
 *    rendered report IS the cache's storage format. tracked as
 *    `.dream/v2026_09_05.fix.guard-review-cache-is-keyed-by-index-not-slug.md`.
 *    🟡 this guard closes the FALSE GREEN and leaves the key wrong — a mismatch still
 *    costs a needless re-run, where the right key would have found the real cache.
 */
export const getOneCacheSafePeerReviewArtifact = (input: {
  cachedReviews: RouteStoneGuardReviewArtifact[];
  index: number;
  slug: string;
}): RouteStoneGuardReviewArtifact | null => {
  // compare in the SANITIZED form, since that is what the filename carries
  // .why = a config slug may hold a path separator, which the write side swaps for a
  //        hyphen. to compare the raw slug would discard every cache of such a reviewer
  // .note = an unreadable name is treated as a mismatch, never as a match — "cannot vouch
  //         for it" and "it belongs to someone else" both mean the verdict may not be reused
  const slugWanted = asSanitizedPeerReviewSlug({ slug: input.slug });
  const owned = input.cachedReviews.filter((review) =>
    isReviewOwnedAtRung({ review, index: input.index, slug: slugWanted }),
  );

  // the LATEST round wins, never the first found
  // 🔴 .why = a round re-run at an unmoved hash (a `.guard` edit, a brain outage) leaves
  //    one given per round at this rung. a first-match read returned the OLDEST, so a 412
  //    malfunction from before the outage cleared painted `malfunction 💥` over lanes that
  //    had just run clean (i003 → i004, 2026-09-26)
  return asLatestReviewArtifact({ reviews: owned });
};

/**
 * .what = whether a cached review sits at this rung AND was minted by this reviewer
 * .why = both halves must hold for reuse; either alone admits another lane's verdict
 */
const isReviewOwnedAtRung = (input: {
  review: RouteStoneGuardReviewArtifact;
  index: number;
  slug: string;
}): boolean =>
  input.review.index === input.index &&
  asPeerReviewSlugFromPath({ path: input.review.path }) === input.slug;

/**
 * .what = the review of the highest iteration, or null when there is none
 * .why = the most recent round is the one whose verdict still stands
 *
 * .note = the max is over a TOTAL order (iteration, then path), so a tie on iteration
 *         resolves the same on every machine, whatever order the glob returned
 */
const asLatestReviewArtifact = (input: {
  reviews: RouteStoneGuardReviewArtifact[];
}): RouteStoneGuardReviewArtifact | null =>
  input.reviews.reduce<RouteStoneGuardReviewArtifact | null>(
    (latest, review) =>
      isLaterByIterationThenPath({ candidate: review, incumbent: latest })
        ? review
        : latest,
    null,
  );
