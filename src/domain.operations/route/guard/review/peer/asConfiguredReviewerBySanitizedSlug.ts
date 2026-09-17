import type { RouteStoneGuardReviewPeer } from '@src/domain.objects/Driver/RouteStoneGuard';

import { asSanitizedPeerReviewSlug } from './asSanitizedPeerReviewSlug';

/**
 * .what = the configured peer reviewers indexed by their SANITIZED slug → the full reviewer
 * .why = named transformer, extracted so a caller reads "the configured reviewer for this
 *        lane" over a re-derive of the sanitize-and-compare inline (raised —
 *        mech-decode-friction). mirrors `asPeerReviewLevelBySlug`'s vocabulary rule — the
 *        map's keys must sit in the DISK vocabulary (the write-side sanitize), never the raw
 *        config vocabulary, since a caller looks a reviewer up by a slug parsed off disk
 *
 * .note = returns the whole `RouteStoneGuardReviewPeer`, over one field, so a caller that
 *         needs `.level` and `.budget` both reads one map over building two
 */
export const asConfiguredReviewerBySanitizedSlug = (input: {
  peerReviews: RouteStoneGuardReviewPeer[];
}): Map<string, RouteStoneGuardReviewPeer> =>
  new Map(
    input.peerReviews.map((review) => [
      asSanitizedPeerReviewSlug({ slug: review.slug }),
      review,
    ]),
  );
