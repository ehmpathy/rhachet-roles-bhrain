import type { RouteStoneGuardReviewPeer } from '@src/domain.objects/Driver/RouteStoneGuard';

import { asSanitizedPeerReviewSlug } from '../asSanitizedPeerReviewSlug';
import { isLevelOverruled } from './isLevelOverruled';

/**
 * .what = the SANITIZED slugs of the peer reviewers whose level was overruled
 * .why = an overruled level's reviewers are forgiven — their critique needs no contemplation
 *        .taken and their blockers do not gate passage; callers read this slug set to skip them.
 *
 * 🔴 .note = the slugs are sanitized because this set is compared against slugs parsed OFF DISK,
 *         and a disk slug is always sanitized — the write side swaps separators before it builds
 *         the .given filename. a config slug legitimately holds a separator: the legacy flat guard
 *         format derives a slug from the command itself (parseStoneGuard.ts:412-413), so
 *         `.test/mock-review.sh` is a real, live, non-retired reviewer.
 *
 * ⚠️ raw, this set could never match such a reviewer, so its human overrule would silently fail to
 *    forgive it — and the same mismatch marked it `retired` in the halt prompt (r11 blocker.1,
 *    i005). the config slug and the disk slug are two vocabularies, and every time one is compared
 *    to the other it goes through asSanitizedPeerReviewSlug.
 *
 * .note = a review's level defaults to 1 when unset, to match the 1-based level convention of
 *         getReviewLevelByIndex and getStoneGuardLevelClearance. the per-level check reads the
 *         shared isLevelOverruled primitive, so "is this level overruled" is decided in one place.
 */
export const getOverruledReviewerSlugs = (input: {
  peerReviews: RouteStoneGuardReviewPeer[];
  overruledLevels: Set<number>;
}): string[] =>
  input.peerReviews
    .filter((review) =>
      isLevelOverruled({
        level: review.level ?? 1,
        overruledLevels: input.overruledLevels,
      }),
    )
    .map((review) => asSanitizedPeerReviewSlug({ slug: review.slug }));
