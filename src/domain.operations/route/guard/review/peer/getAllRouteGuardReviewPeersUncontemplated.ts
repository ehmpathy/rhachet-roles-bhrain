import { getRouteGuardReviewPeerPathTaken } from './getRouteGuardReviewPeerPathTaken';

/**
 * .what = of the latest-per-slug peer givens that hold blockers, returns those
 *         without a taken paired to THAT given — each tagged absent or stale
 * .why = the contemplation gate must distinguish "never answered" (absent) from
 *        "answered a prior given" (stale) so the driver gets exact guidance
 *
 * a reviewer is "satisfied" (needs no taken) when its given holds 0 blockers —
 * this covers BOTH the clean (0/0) and the nitpick-only (0 blockers, N nitpicks)
 * quadrants. contemplation is required iff blockers > 0 (see blueprint B8).
 *
 * 🔴 a taken pairs its given by the DERIVED PATH, never by the current hash and
 * never by (slug, hash). the taken's path is a pure transform of the given's path,
 * so a given carried from an earlier iteration prints a taken path at that earlier
 * hash; to match against the current hash would demand a file the driver has no way
 * to produce, and that is a deadlock. it is why this operation takes no hash at all.
 *
 * 🔴 and (slug, hash) is NOT a given's identity, because a .taken write does not
 * move the artifact hash — the hash covers the `artifacts:` set only. so a reviewer
 * that re-runs after it was answered writes its fresh given at the SAME hash, one
 * iteration later, and a (slug, hash) key hands that fresh critique the PRIOR
 * iteration's answer. the path carries the iteration verbatim, so it separates the
 * two givens that the hash alone conflates (r8 blocker.1, i002).
 */
export const getAllRouteGuardReviewPeersUncontemplated = (input: {
  givens: { slug: string; blockers: number; pathGiven: string }[];
  takens: { slug: string; pathTaken: string }[];
}): { slug: string; tag: 'absent' | 'stale' }[] => {
  // only givens that hold blockers gate progress; clean + nitpick-only need no taken
  const givensGated = input.givens.filter((given) => given.blockers > 0);

  // a gated given is uncontemplated when no taken sits at the path IT derives
  // .note = getRouteGuardReviewPeerPathTaken is the ONE grammar source for the
  //         given↔taken pair. to ask it, rather than to re-derive the pair from a
  //         subset of the coordinates, is what makes a silent desync impossible —
  //         which is exactly what the (slug, hash) re-derivation suffered
  const pathsTaken = new Set(input.takens.map((taken) => taken.pathTaken));
  const givensUncontemplated = givensGated.filter(
    (given) =>
      !pathsTaken.has(
        getRouteGuardReviewPeerPathTaken({ pathGiven: given.pathGiven }),
      ),
  );

  // tag each: stale if this reviewer was answered before, else never answered
  // .note = 'stale' now means the reviewer has SPOKEN AGAIN since the driver last
  //         answered it — a prior taken exists, but not for the given that is live.
  //         it no longer means "the artifact changed under a still-current answer"
  return givensUncontemplated.map((given) => ({
    slug: given.slug,
    tag: input.takens.some((taken) => taken.slug === given.slug)
      ? ('stale' as const)
      : ('absent' as const),
  }));
};
