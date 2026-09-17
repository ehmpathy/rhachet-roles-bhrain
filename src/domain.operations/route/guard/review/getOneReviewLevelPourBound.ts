/**
 * .what = the most lanes of one level that can be aloft at once — or null where
 *         no bound binds this roster at all
 *
 * .why = the pour announce claimed a cap it had not computed. it rendered the
 *        LEVEL-WIDE default verbatim, so a level whose every member sits in a
 *        `concurrency: 1` group printed `≤10 at a time` while exactly one lane
 *        ran. a driver who reads that line is told the wrong cap — the precise
 *        inverse of what the announce exists to communicate, since a reader who
 *        sees three lanes announce and one run reads the FEATURE as absent
 *        (raised i011/r9)
 *
 * .why a LEAF beside the render = the same split `getAllConcurrencyGroupLeaks`
 *        and `asConcurrencyGroupLeakAdvisory` already hold — one decides WHAT
 *        the number is, one decides how it READS. so a change to the arithmetic
 *        cannot touch the prose, and the arithmetic gets a clamp of its own at
 *        the unit grain (`rule.prefer.decomposable-architecture`)
 *
 * 🔴 .the arithmetic = a group's bound caps the GROUP, never the level, so a
 *     group of two behind a bound of five contributes TWO. the level's own
 *     bound then caps the sum:
 *
 *       bound = min( levelConcurrency,
 *                    Σ min(groupBound, membersOfThatGroupHere)
 *                    + countOfUngroupedMembers )
 *
 * 🟡 .why it answers NULL when the bound reaches the roster = a bound that
 *     admits every member holds naught back, so a clause that states it
 *     describes the ROSTER rather than the constraint. four ungrouped lanes
 *     under a level bound of ten would read `pours 4 lanes · ≤4 at a time`,
 *     which invites a reader to hunt for a valve that is not there
 *
 *     ⇒ so the clause appears exactly when the bound BINDS, which is what makes
 *       its presence informative. `asReviewLevelPourAnnounce` already renders
 *       null as no clause at all, so this needs no new render branch
 *
 * .note = an unknown group name counts its members as unbounded rather than
 *         invents a bound. `assertConcurrencyGroupsResolve` refuses that guard
 *         at parse and `runWithinConcurrencyBounds` throws on it at the pour, so
 *         the reach is for a guard built by hand around the parser — and where
 *         it is reached, the display errs toward the roster it can see
 *
 * ⚠️ .this arithmetic MIRRORS the nest in `runWithinConcurrencyBounds` — the
 *     group bound inside, the level bound outside, so both yield `min(group,
 *     level)`. the announce here and the pour there are two independent models
 *     of one bound, kept in lockstep by test discipline alone. a change to that
 *     nest order or to either bound MUST update this `min(...)`, or the announce
 *     claims a cap the pour does not hold — the i011/r9 defect, in reverse
 */
export const getOneReviewLevelPourBound = (input: {
  /** this level's members, each with the group it joined or null */
  members: { group: string | null }[];
  /** the bound every lane at this level inherits */
  levelConcurrency: number;
  /** one bound per declared concurrency group, guard-wide */
  groups: Record<string, { concurrency: number }>;
}): number | null => {
  // an empty roster pours naught, so no bound can bind it
  if (input.members.length === 0) return null;

  // how many members of this level each group holds
  const countByGroup = new Map<string, number>();
  let ungrouped = 0;
  input.members.forEach((member) => {
    if (!member.group) {
      ungrouped++;
      return;
    }
    countByGroup.set(member.group, (countByGroup.get(member.group) ?? 0) + 1);
  });

  // each group contributes the narrower of its bound and its own membership
  const groupedCapacity = [...countByGroup.entries()].reduce(
    (sum, [name, count]) => {
      const groupBound = input.groups[name]?.concurrency;
      return (
        sum + (groupBound === undefined ? count : Math.min(groupBound, count))
      );
    },
    0,
  );

  const bound = Math.min(input.levelConcurrency, groupedCapacity + ungrouped);

  // a bound that admits the whole roster holds naught back
  return bound >= input.members.length ? null : bound;
};
