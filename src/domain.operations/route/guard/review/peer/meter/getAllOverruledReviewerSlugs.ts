import type { RouteStoneGuardReviewPeer } from '@src/domain.objects/Driver/RouteStoneGuard';

import { asSanitizedPeerReviewSlug } from '../asSanitizedPeerReviewSlug';
import { isLevelOverruled } from './isLevelOverruled';

/**
 * .what = the SANITIZED slugs of the peer reviewers whose level was overruled
 * .why = an overruled level's reviewers are forgiven — their critique needs no feedbackAbsorption
 *        .taken and their blockers do not gate passage; callers read this slug set to skip them.
 *
 * 🔴 .note = the slugs are sanitized because this set is compared against slugs parsed OFF DISK,
 *         and a disk slug is always sanitized — the write side swaps separators before it builds
 *         the .given filename. a config slug legitimately holds a separator: the legacy flat guard
 *         format derives a slug from the command itself (parseStoneGuard.ts:412-413), so
 *         `.test/mock-review.sh` is a real, live, non-retired reviewer. raw, this set could never
 *         match such a reviewer, so its human overrule would silently fail to forgive it. the
 *         config slug and the disk slug are two vocabularies, and every comparison between them
 *         goes through asSanitizedPeerReviewSlug.
 *
 * .note = a review's level is read as given: the parse step guarantees it, so no default lives
 *         here. the per-level check reads the shared isLevelOverruled primitive, so "is this level
 *         overruled" is decided in one place.
 */
export const getAllOverruledReviewerSlugs = (input: {
  peerReviews: RouteStoneGuardReviewPeer[];
  overruledLevels: Set<number>;
}): string[] =>
  input.peerReviews
    .filter((review) =>
      isLevelOverruled({
        level: review.level,
        overruledLevels: input.overruledLevels,
      }),
    )
    .map((review) => asSanitizedPeerReviewSlug({ slug: review.slug }));
