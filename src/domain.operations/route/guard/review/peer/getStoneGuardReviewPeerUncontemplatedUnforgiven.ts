import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { getGuardPeerReviews } from '@src/domain.objects/Driver/RouteStoneGuard';

import { getStoneGuardOverruledLevels } from '../../../judges/getStoneGuardOverruledLevels';
import { asPeerReviewLevelBySlug } from './asPeerReviewLevelBySlug';
import { computePeerUncontemplatedUnforgiven } from './computePeerUncontemplatedUnforgiven';
import {
  getRouteGuardReviewPeerContemplationStatus,
  type RouteGuardReviewPeerUncontemplated,
} from './getRouteGuardReviewPeerContemplationStatus';
import { getOverruledReviewerSlugs } from './meter/getOverruledReviewerSlugs';

/**
 * .what = each peer reviewer whose LATEST given still awaits a .taken AND is NOT
 *         already forgiven by an overrule — paired with its level
 * .why = ONE source of truth for "is a contemplation left to forgive, and at which
 *        level?" so the passage gate (setStoneAsPassed) and the admin-escape
 *        short-circuits (setStoneAsOverruled / setStoneAsForced) cannot drift on
 *        which reviewers count. an uncontemplated reviewer at an already-overruled
 *        level is waved through (design-note B6); only an un-overruled reviewer that
 *        holds blockers and awaits an answer remains uncontemplated-and-unforgiven.
 *        the level lets a caller scope a forgivial overrule to exactly that rung,
 *        never the whole ladder at once.
 *
 * .note = it returns the FULL contemplation record, never just (slug, level). the
 *         overrule short-circuits read only .slug and .level, but the two passage
 *         gates render a reply-prompt that needs each reviewer's verdict counts and
 *         both conversation paths. were the record dropped here, those gates would
 *         have to re-read this same directory and re-join by slug — a second answer
 *         to "whom does the prompt name", beside the one this operation exists to be.
 */
export const getStoneGuardReviewPeerUncontemplatedUnforgiven = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<
  (RouteGuardReviewPeerUncontemplated & {
    level: number;
    retired: boolean;
  })[]
> => {
  // read the contemplation status (latest given per reviewer, holds blockers, un-answered)
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

  // keyed on the SANITIZED slug — the vocabulary the disk-parsed lookups arrive in.
  // the rule lives in the transformer, where it is unit-clamped (r11 blocker.1, i005)
  const levelBySlug = asPeerReviewLevelBySlug({ peerReviews });

  // hand the loaded state to the pure filter — the B6 forgiveness rule lives there, unit-tested
  return computePeerUncontemplatedUnforgiven({
    uncontemplated: contemplation.uncontemplated,
    overruledSlugs,
    levelBySlug,
  });
};
