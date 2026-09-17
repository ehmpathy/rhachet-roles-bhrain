/**
 * .what = decides whether a reviewer was SKIPPED for want of budget on this pass
 * .why = this one boolean drives LEVEL UNLOCK, so it must read as a named claim
 *        rather than as a two-clause expression a reader simulates. it is also
 *        the one derivation whose precedence a test should be able to pin at the
 *        leaf grain (`rule.forbid.inline-decode-friction`, raised i031/r3)
 *
 * .note = "skipped" is NOT "spent-out". the two differ on exactly one pass — the
 *         one that consumes the last round — and that pass must read `rejected`
 *         (`define.invariant.review.peer.exhausted`)
 */
export const isReviewPeerSkippedForBudget = (input: {
  /**
   * the reviewer's slug
   */
  slug: string;

  /**
   * every slug a settled level recorded as skipped for want of budget
   *
   * 🔴 the AUTHORITATIVE record, and it is read FIRST. it is pushed to where a
   *    level settles, so by the time a HIGHER level's gate calls this, every
   *    lower skipped reviewer is already in it. the cached-artifact hash cannot
   *    carry this: a skipped reviewer whose cached rejection happens to sit at
   *    the current hash is indistinguishable from one that just ran, so a
   *    hash-only test pins the level shut forever
   *    (`define.invariant.review.peer.level-unlock-on-budget-exhaustion`)
   */
  exhaustedSlugs: string[];

  /**
   * whether an artifact for this reviewer was minted on THIS pass
   *
   * ⚠️ a settled level populates this for skipped members too, which is why the
   *    floor below falls silent once the level settles
   */
  hasArtifactThisPass: boolean;

  /**
   * rounds this reviewer has already spent
   */
  rounds: number;

  /**
   * rounds this reviewer is allowed
   */
  budget: number;
}): boolean => {
  // the authoritative record
  if (input.exhaustedSlugs.includes(input.slug)) return true;

  // ⚠️ the FLOOR, never the mechanism. it covers a reviewer at a level that has
  //    not settled yet, where the set above cannot hold it. once the level
  //    settles the set carries every case and this clause is inert.
  //    measured: disable the clause above and 8 assertions across [t2]/[t3]/[t4]
  //    of driver.route.peer-budget-exhaustion-unlocks-level go red
  return !input.hasArtifactThisPass && input.rounds >= input.budget;
};
