import { compareStrings } from './compareStrings';
import type { RouteGuardReviewPeerGiven } from './getAllRouteGuardReviewPeerGivens';

/**
 * .what = of every peer .given across all hashes, keeps the LATEST per slug, by iteration
 * .why = a reviewer speaks once per round; only its most recent word is live. an earlier given
 *        from the same reviewer was already superseded BY that reviewer, so it can neither gate
 *        nor be answered. this is the P2a half of the contemplation fix — the read that makes the
 *        debt survive an edit to the artifact under review (0.wish.md defect D2).
 *
 * .note = kept pure, and in its own file, so the pick is unit-checkable without a route on disk —
 *         the fs reads live in the async caller (rule.require.orchestrators-as-narrative). its
 *         neighbour computePeerUncontemplatedUnforgiven is split out for the same reason.
 *
 * .note = 🔴 the winner is a MAX over a TOTAL order, never a first-or-last of the input, and the
 *         TOTALITY is the guarantee rather than the max. enumFilesFromGlob returns raw globby
 *         output and no caller sorts it, so any pick that leans on array order is
 *         filesystem-dependent — right on one machine, wrong on another
 *         (rule.forbid.order-dependence). a max over iteration ALONE is a partial order and
 *         leaks exactly that: two givens tied on iteration leave a strict `>` with whichever
 *         arrived first. pathGiven breaks every tie, because two files cannot share a path.
 *         case4 shuffles distinct iterations, case9 shuffles a tie; both demand one winner.
 *
 * .note = a (slug, iteration) tie wants one reviewer to speak twice within one round, so it is
 *         not expected — and it is deliberately NOT thrown on. this pick gates passage, so a
 *         throw would hold the stone with no exit a driver could take: the same deadlock the
 *         undetected-verdict branch of getAllRouteGuardReviewPeerGivens sidesteps. where no
 *         semantic answer exists, a stable answer beats an arbitrary one.
 *
 * .note = 🔴 the OUTPUT is sorted by slug, and that is a second, separate guarantee. a max makes
 *         the winner order-free; it leaves the SEQUENCE at map-insertion order, which is glob
 *         order, which is the filesystem's. that sequence is not private — the filter/map chain
 *         downstream keeps it intact all the way to the halt prompt, so the reviewers a driver is
 *         told to answer would be listed in a different order on a different machine. the
 *         neighbour getLatestReviewFilesPerIndex sorts its own output for this same reason. slug
 *         is a safe key because the map guarantees one entry per slug.
 */

/**
 * .what = the total order over peer givens — iteration first, then path
 * .why = iteration carries the real recency; path is the tie-break that makes the order TOTAL,
 *        and it is unique by construction, so no two distinct givens ever compare equal
 */
const comparePeerGivenRecency = (
  a: RouteGuardReviewPeerGiven,
  b: RouteGuardReviewPeerGiven,
): number => {
  if (a.iteration !== b.iteration) return a.iteration - b.iteration;
  return compareStrings(a.pathGiven, b.pathGiven);
};

export const getLatestPeerGivensPerSlug = (input: {
  givens: RouteGuardReviewPeerGiven[];
}): RouteGuardReviewPeerGiven[] => {
  // .note = deliberate mutation of a scoped local accumulator. the map is allocated here and
  //         never escapes — only its values do, copied into a fresh array — and a group-by is
  //         what a map is for; a reduce that rebuilt it per element would be O(n^2) for no gain
  //         (rule.require.immutable-vars permits mutation that is isolated and annotated)
  const latestBySlug = new Map<string, RouteGuardReviewPeerGiven>();

  for (const given of input.givens) {
    const incumbent = latestBySlug.get(given.slug);
    if (!incumbent || comparePeerGivenRecency(given, incumbent) > 0)
      latestBySlug.set(given.slug, given);
  }

  return [...latestBySlug.values()].sort((a, b) =>
    compareStrings(a.slug, b.slug),
  );
};
