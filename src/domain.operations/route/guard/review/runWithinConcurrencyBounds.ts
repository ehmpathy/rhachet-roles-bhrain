import { BadRequestError } from 'helpful-errors';
import type { Bottleneck } from 'with-bottleneck';

/**
 * .what = runs one thunk inside the bounds that govern it — its concurrency
 *         group's, then its level's
 *
 * .why  = a group slot is the one a lane can HOLD while blocked without cost to
 *         anyone else, so it is taken on the OUTSIDE. to take the level slot
 *         first would park a blocked group member on a level slot it cannot use,
 *         and starve an ungrouped reviewer that could have run.
 *
 * .note = the order is right whichever bound is numerically smaller. the nest
 *         yields `min(group, level)` either way, so a group declared WIDER than
 *         the level default still pours at the level's bound — the order buys
 *         starvation-freedom, never the bound itself.
 *
 *         ⚠️ that clause is now MEASURED rather than argued. reverse the nest
 *         and `[case1]`, `[case2]`, `[case3]` stay green — every bound holds —
 *         while `[case4]` goes red on the one property the order owns: the
 *         ungrouped lane is starved, and max-in-flight falls from 2 to 1
 *
 * .note = 🔴 starvation-freedom and the F13 hazard are the SAME observation,
 *         read two ways, and that is a fact about the design rather than about
 *         the tests. `[case4]` reads `maxInFlight = 2` as *"the ungrouped lane
 *         was not starved"*; `[case6]` reads the identical 2 as *"a group
 *         declared at 1 admitted 2"*. both are true of one line of code — the
 *         reach above, which hands an ungrouped lane the level bound alone
 *
 *         ⇒ so F13 cannot be closed HERE without a trade. measured 2026-09-12:
 *         route an ungrouped lane through its level-mates' group bounds and
 *         **4 tests go red — two in `[case4]`, two in `[case6]`** — because the
 *         ungrouped lane is once again parked behind a bound it cannot use.
 *         ⚠️ that is the starvation the nest order was chosen to prevent, so
 *         the naive close trades a ratelimit leak for a throughput defect
 *
 *         🔴 and at ACCEPTANCE grain the same arm is not a trade at all. the
 *         identical edit turns **6 clamps red** in
 *         `driver.route.peer-concurrency.acceptance.test.ts`, and only ONE is
 *         the F13 hazard — `[case1]`, `[case2]`, `[case5]`, `[case6]`, and
 *         `[case9][t7]` each fall from their declared peak to **1**.
 *
 *         ⇒ a `byGroup` map is GUARD-wide, never level-wide, so one group
 *         declared at `concurrency: 1` for an l3 provider would serialize
 *         **every ungrouped lane at every level** — l1 included, which declares
 *         no group at all. ⚠️ that destroys the wish's acceptance 1 outright,
 *         so the naive close is priced out on throughput rather than merely
 *         traded against it
 *
 *         ⇒ F13's live options are the ones that leave this reach alone: warn
 *         the author at the pour (G), or require an explicit `group:` on every
 *         reviewer so no lane is implicitly ungrouped (D)
 *
 *         ✅ **option G LANDED 2026-09-13**, and it left this reach untouched —
 *         which is the whole reason it was the affordable one.
 *         `getAllConcurrencyGroupLeaks` names every level that mixes a bounded
 *         group with an unbounded lane, and `runStoneGuardReviews` advises the
 *         author on STDERR at the pour. so the hazard below is unchanged and no
 *         longer SILENT — an author is told, and decides.
 *
 *         ⇒ the two clamps are `getAllConcurrencyGroupLeaks.test.ts` (nine
 *         cases, the detector) and `driver.route.peer-concurrency [t5]` (the
 *         WIRE — cut the emit and exactly one clamp goes red, measured).
 *         option D stays open for the council: an advisory informs, and only a
 *         required `group:` would make the leak unexpressible.
 *
 * ⚠️ .the ANNOUNCED cap that mirrors this nest lives in
 *     `getOneReviewLevelPourBound` — `min(levelConcurrency, Σ min(groupBound,
 *     members) + ungrouped)`. that formula and this nest are two independent
 *     models of one bound. a change to the nest order here, or to which bound
 *     wraps which, MUST update that formula — or the pour announce reports a cap
 *     this pour does not enforce (the i011/r9 defect)
 *
 * .note = it is a LEAF on purpose. it opened as an inline closure inside
 *         `runStoneGuardReviews`, where the whole argument above lived in a
 *         comment and no test could reach it — the nest was exercised only
 *         through real subprocess fixtures, which cannot observe a bound they
 *         do not bind. extracted so the invariant has a clamp of its own
 */
export const runWithinConcurrencyBounds = async <T>(input: {
  /** the concurrency group this lane joined, or null where it declared none */
  group: string | null;
  /** the bound every lane at this level inherits */
  level: Bottleneck;
  /** one bound per declared concurrency group */
  byGroup: Map<string, Bottleneck>;
  /** the work to pour */
  run: () => Promise<T>;
}): Promise<T> => {
  // an ungrouped lane contends for a level slot only
  // 🔴 .why `schedule` and NEVER a manual `semaphore.acquire` = `schedule`
  //        releases on the reject path; a hand-rolled acquire without a
  //        `finally` does not, and one thrown lane then narrows the bound for
  //        the rest of the pass — a hung reviewer at a later level rather than a
  //        loud failure. clamped by `[case9]`, which goes red under exactly that
  //        naive arm while `[t0]` stays green: the leak is SILENT, which is what
  //        makes it a behavior hazard. raised i031/r7
  if (!input.group) return await input.level.schedule(input.run);

  // a valve that fails OPEN is worse than no valve, so an unresolvable group
  // is a loud throw rather than an unbounded pour
  // .note = `assertConcurrencyGroupsResolve` refuses this at parse, so this
  //         reach fires only for a guard built by hand around the parser
  // the remedy rides in the MESSAGE, not the metadata — the cli renders the
  // message as the error a human reads, and appends metadata as a raw json blob
  // below it. a fix named only in `hint` names the fault to the human and hides
  // the repair (rule.require.errors-name-the-fix)
  const group = input.byGroup.get(input.group);
  if (!group)
    throw new BadRequestError(
      `concurrency group has no bound declared: "${input.group}" — declare it under reviews.groups.${input.group}.concurrency`,
    );

  return await group.schedule(
    async () => await input.level.schedule(input.run),
  );
};
