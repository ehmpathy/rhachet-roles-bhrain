import type { RouteStoneGuardReviewArtifact } from '@src/domain.objects/Driver/RouteStoneGuardReviewArtifact';

import { asPeerReviewSlugFromPath } from './asPeerReviewSlugFromPath';
import { asSanitizedPeerReviewSlug } from './asSanitizedPeerReviewSlug';

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
 * ⚠️ an INSERT is worse than a swap and far easier to do unnoticed, because you remove
 *    no one — it shifts every later lane by one at once.
 *
 * ⚠️ it fails safe by construction. a discarded cache costs one budget round, which is
 *    the correct price for a rung whose tenant changed. a reused wrong one cannot be
 *    detected downstream at all.
 *
 * 🔴 TODO: fix structurally with option A — key the cache on the slug itself, rather than
 *    a reconciliation at each read. that needs a `slug` field on the artifact, a writer
 *    change, a reader change with back-compat, and a stamp-format migration, since the
 *    rendered report IS the cache's storage format. tracked as
 *    `.dream/v2026_09_05.fix.guard-review-cache-is-keyed-by-index-not-slug.md`.
 *    ⚠️ this guard closes the FALSE GREEN and leaves the key wrong — a mismatch still
 *    costs a needless re-run, where the right key would have found the real cache.
 */
export const getCacheSafePeerReviewArtifact = (input: {
  cachedReviews: RouteStoneGuardReviewArtifact[];
  index: number;
  slug: string;
}): RouteStoneGuardReviewArtifact | null => {
  const cached = input.cachedReviews.find((r) => r.index === input.index);
  if (!cached) return null;

  // compare in the SANITIZED form, since that is what the filename carries
  // .why = a config slug may hold a path separator, which the write side swaps for a
  //        hyphen. to compare the raw slug would discard every cache of such a reviewer
  const slugCached = asPeerReviewSlugFromPath({ path: cached.path });
  const slugWanted = asSanitizedPeerReviewSlug({ slug: input.slug });

  // an unreadable name is treated as a mismatch, never as a match
  // .why = "cannot vouch for it" and "it belongs to someone else" both mean the verdict
  //        may not be reused, and both are safe to answer with a re-run
  return slugCached === slugWanted ? cached : null;
};
