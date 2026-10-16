import {
  getGuardPeerReviews,
  type RouteStoneGuard,
} from '@src/domain.objects/Driver/RouteStoneGuard';

/**
 * .what = the slug of each peer reviewer a guard declares, in declared order — none for no guard
 * .why = the partition check keys each reviewer by its slug alone; one name states that the
 *        orchestrator hands down slugs, never the reviewers
 */
export const getAllGuardPeerSlugs = (input: {
  guard: RouteStoneGuard | null;
}): string[] =>
  input.guard ? getGuardPeerReviews(input.guard).map((peer) => peer.slug) : [];
