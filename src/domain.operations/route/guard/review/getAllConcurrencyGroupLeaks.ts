import { getAllReviewLevelsAsc } from './getAllReviewLevelsAsc';

/**
 * .what = finds every level where a lane with no concurrency group shares the
 *         level with a lane that declared one
 *
 * .why  = 🔴 that shape defeats the valve, and it does so SILENTLY. an ungrouped
 *         lane contends for a level slot only (`runWithinConcurrencyBounds`), so
 *         a level whose grouped members pour one-at-a-time behind a provider
 *         ratelimit still admits its ungrouped co-member alongside them. the
 *         group's bound is honored and the RATELIMIT is not — which is the one
 *         outcome the whole feature exists to prevent.
 *
 *         ⇒ fulcrum F13. the two mechanizable closes are both priced out:
 *         option D (require `group:` on every reviewer) breaks every extant
 *         guard, and the naive reach-through goes 6 acceptance clamps red
 *         because a `byGroup` map is GUARD-wide — one group at `concurrency: 1`
 *         would serialize every ungrouped lane at EVERY level, l1 included.
 *
 *         ⇒ so this is option G: **advise at the pour**, never refuse at parse.
 *
 * .why NOT a refusal = the mix is sometimes exactly what an author wants — a
 *         cheap local lane beside three rate-limited ones is legitimate, and
 *         `assertConcurrencyGroupsResolve` cannot tell that case from the
 *         defect. seed S4 settles why: *"only the guard author knows which
 *         reviewers share a ratelimit."* a parse-time throw would refuse a
 *         correct guard, so the valve advises and the author decides.
 *
 * .why it fires at the POUR rather than at parse = the failure is the ABSENCE
 *         of a key, and a parse-time check reads what is present. at the pour
 *         the level's whole roster is in hand, so the absence is legible — and
 *         it lands at the moment the author is watchful, which a source comment
 *         in `RouteStoneGuard.ts` never is. an author writes yaml and does not
 *         open the domain object.
 *
 * .note = a level with NO grouped member is not a leak. every lane there pours
 *         at the level bound by declaration, which is what an author who wrote
 *         no `groups:` asked for.
 */
export const getAllConcurrencyGroupLeaks = (input: {
  /** every peer reviewer on the stone, with its level and its group */
  peers: { slug: string; level: number; group: string | null }[];
}): {
  /** the level the leak sits at */
  level: number;
  /** the groups whose bound this level's ungrouped lanes pour past */
  groups: string[];
  /** the lanes that declared no group, and so escape those bounds */
  ungrouped: string[];
}[] => {
  // .why = the canonical transformer, never a re-inline. an inline `.sort()`
  //         with no comparator sorts LEXICALLY, and a fourth copy is a fourth
  //         place that comparator can go absent — `getAllReviewLevelsAsc`'s
  //         own docblock forbids exactly this
  const levels = getAllReviewLevelsAsc({ peers: input.peers });

  return levels.flatMap((level) => {
    const members = input.peers.filter((peer) => peer.level === level);
    const ungrouped = members.filter((peer) => !peer.group);
    const groups = [
      ...new Set(
        members
          .map((peer) => peer.group)
          .filter((group): group is string => !!group),
      ),
    ];

    // a leak needs BOTH halves present at one level
    if (!ungrouped.length || !groups.length) return [];

    return [
      {
        level,
        groups,
        ungrouped: ungrouped.map((peer) => peer.slug),
      },
    ];
  });
};
