/**
 * .what = the pure filter at the heart of getStoneGuardReviewPeerUncontemplatedUnforgiven: from
 *         the reviewers that still owe a .taken, drop the ones an overrule already forgave, and
 *         pair each survivor with its level.
 * .why = design-note B6 — an uncontemplated reviewer at an already-overruled level is waved
 *        through; only an un-forgiven reviewer remains owed. kept pure so the forgiveness rule is
 *        unit-checkable without a route on disk — the fs reads live in the async caller
 *        (rule.require.orchestrators-as-narrative).
 *
 * .note = 🔴 generic over the record, so the narrow is LOSSLESS. hand it a bare { slug } and it
 *         returns { slug, level }; hand it full contemplation records and it returns those
 *         records, each with its level. a narrow that kept only (slug, level) forced every
 *         caller that needs the record — the reply-prompt needs each verdict and both
 *         conversation paths — to re-read the whole directory and re-join by slug. that re-join
 *         was a SECOND source of truth for whom the prompt names, beside the one this file
 *         exists to be, and it could drift from it. the type parameter deletes it outright.
 */
export const computePeerUncontemplatedUnforgiven = <
  T extends { slug: string },
>(input: {
  uncontemplated: T[];
  overruledSlugs: Set<string>;
  levelBySlug: Map<string, number>;
}): (T & { level: number; retired: boolean })[] =>
  input.uncontemplated
    .filter((reviewer) => !input.overruledSlugs.has(reviewer.slug))
    .map((reviewer) => ({
      ...reviewer,
      level: input.levelBySlug.get(reviewer.slug) ?? 1,
      // 🔴 levelBySlug is built from the LIVE guard config, so a slug it does not carry is a
      //    reviewer that was deleted from the config while it still held an unanswered blocker.
      //    under the reviewer-keyed debt that given no longer self-clears on a hash move, so the
      //    driver is named a reviewer it cannot find. the flag is what lets the prompt SAY so —
      //    absent it, the `?? 1` default renders a retired reviewer as an ordinary level-1 one
      //    and the halt reads as a mistake rather than as a state (F8)
      retired: !input.levelBySlug.has(reviewer.slug),
    }));
