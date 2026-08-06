import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { getGuardPeerReviews } from '@src/domain.objects/Driver/RouteStoneGuard';

import { getStoneGuardOverruledLevels } from '../../../judges/getStoneGuardOverruledLevels';
import { computePeerUncontemplatedUnforgiven } from './computePeerUncontemplatedUnforgiven';
import { getRouteGuardReviewPeerContemplationStatus } from './getRouteGuardReviewPeerContemplationStatus';
import { getOverruledReviewerSlugs } from './meter/getOverruledReviewerSlugs';

/**
 * .what = each current-iteration peer reviewer that still awaits a .taken AND is
 *         NOT already forgiven by an overrule — paired with its level
 * .why = ONE source of truth for "is a contemplation left to forgive, and at which
 *        level?" so the passage gate (setStoneAsPassed) and the admin-escape
 *        short-circuits (setStoneAsOverruled / setStoneAsForced) cannot drift on
 *        which reviewers count. an uncontemplated reviewer at an already-overruled
 *        level is waved through (design-note B6); only an un-overruled reviewer that
 *        holds blockers and awaits an answer remains uncontemplated-and-unforgiven.
 *        the level lets a caller scope a forgivial overrule to exactly that rung,
 *        never the whole ladder at once.
 */
export const getStoneGuardReviewPeerUncontemplatedUnforgiven = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<{ slug: string; level: number }[]> => {
  // read the current-iteration contemplation status (holds blockers, un-answered)
  const contemplation = await getRouteGuardReviewPeerContemplationStatus({
    route: input.route,
    stone: input.stone,
  });

  // no uncontemplated reviewers at all → none to forgive
  if (contemplation.uncontemplated.length === 0) return [];

  // forgive reviewers at an overruled level — the human already waved them through
  const overruledLevels = await getStoneGuardOverruledLevels({
    stone: input.stone,
    route: input.route,
  });
  const peerReviews = input.stone.guard
    ? getGuardPeerReviews(input.stone.guard)
    : [];
  const overruledSlugs = new Set(
    getOverruledReviewerSlugs({ peerReviews, overruledLevels }),
  );
  const levelBySlug = new Map(
    peerReviews.map((review) => [review.slug, review.level ?? 1]),
  );

  // hand the loaded state to the pure filter — the B6 forgiveness rule lives there, unit-tested
  return computePeerUncontemplatedUnforgiven({
    uncontemplated: contemplation.uncontemplated,
    overruledSlugs,
    levelBySlug,
  });
};
