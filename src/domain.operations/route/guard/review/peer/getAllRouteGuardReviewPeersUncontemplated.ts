/**
 * .what = of the current-hash peer givens that hold blockers, returns those
 *         without a paired current-hash taken — each tagged absent or stale
 * .why = the contemplation gate must distinguish "never answered" (absent) from
 *        "answered a prior generation" (stale) so the driver gets exact guidance
 *
 * a reviewer is "satisfied" (needs no taken) when its given holds 0 blockers —
 * this covers BOTH the clean (0/0) and the nitpick-only (0 blockers, N nitpicks)
 * quadrants. contemplation is required iff blockers > 0 (see blueprint B8).
 */
export const getAllRouteGuardReviewPeersUncontemplated = (input: {
  hashCurrent: string;
  givens: { slug: string; blockers: number }[];
  takens: { slug: string; hash: string }[];
}): { slug: string; tag: 'absent' | 'stale' }[] => {
  // only blocker-bearing givens gate progress; clean + nitpick-only need no taken
  const givensGated = input.givens.filter((given) => given.blockers > 0);

  // a gated given is uncontemplated when no taken for its slug exists at the current hash
  const givensUncontemplated = givensGated.filter(
    (given) =>
      !input.takens.some(
        (taken) =>
          taken.slug === given.slug && taken.hash === input.hashCurrent,
      ),
  );

  // tag each: stale if a taken exists at a prior hash, else absent
  return givensUncontemplated.map((given) => ({
    slug: given.slug,
    tag: input.takens.some((taken) => taken.slug === given.slug)
      ? ('stale' as const)
      : ('absent' as const),
  }));
};
