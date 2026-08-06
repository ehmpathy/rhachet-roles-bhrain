/**
 * .what = the pure filter at the heart of getStoneGuardReviewPeerUncontemplatedUnforgiven: from
 *         the reviewers that still owe a .taken, drop the ones an overrule already forgave, and
 *         pair each survivor with its level.
 * .why = design-note B6 — an uncontemplated reviewer at an already-overruled level is waved
 *        through; only an un-forgiven reviewer remains owed. kept pure so the forgiveness rule is
 *        unit-checkable without a route on disk — the fs reads live in the async caller
 *        (rule.require.orchestrators-as-narrative).
 */
export const computePeerUncontemplatedUnforgiven = (input: {
  uncontemplated: { slug: string }[];
  overruledSlugs: Set<string>;
  levelBySlug: Map<string, number>;
}): { slug: string; level: number }[] =>
  input.uncontemplated
    .filter((reviewer) => !input.overruledSlugs.has(reviewer.slug))
    .map((reviewer) => ({
      slug: reviewer.slug,
      level: input.levelBySlug.get(reviewer.slug) ?? 1,
    }));
