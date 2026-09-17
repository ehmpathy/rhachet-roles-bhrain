/**
 * .what = composes the advisory one leaked level announces at the pour
 *
 * .why = the mirror half of `asReviewLevelPourAnnounce`. both render a level's
 *        shape to a watchful human on stderr, and both were built inline at the
 *        emit before they were leaves — the pour announce got its own file, and
 *        this one did not, so the orchestrator carried a six-line template
 *        beside a `console.error`. raised i011/r4, point 2
 *
 * .why a LEAF = a render is pure, so it clamps at the unit grain. inline it was
 *        reachable only through the acceptance suite, which spins a subprocess
 *        per case — so the prose a human reads under pressure had no cheap
 *        oracle at all
 *
 * .why the detection is elsewhere = `getAllConcurrencyGroupLeaks` decides WHAT
 *        leaks and this decides how it READS. the split is the round's own grain
 *        discipline: a transformer per concern, so a change to the prose cannot
 *        touch the predicate and a change to the predicate cannot touch prose
 *
 * .note = it names `group:` as the close and then licenses the mix outright. the
 *         bound is fulcrum F13 and seed S4 — *"only the guard author knows which
 *         reviewers share a ratelimit"* — so the line must not read as a defect
 *         report. it advises, and the author decides
 */
export const asConcurrencyGroupLeakAdvisory = (input: {
  /** the level the leak sits at */
  level: number;
  /** the groups whose bound this level's ungrouped lanes pour past */
  groups: string[];
  /** the lanes that declared no group, and so escape those bounds */
  ungrouped: string[];
}): string => {
  // 🔴 ONE MEMBER PER BRANCH, never a comma-joined line
  // .why = it was `join(', ')` on both lines until i022. its own mirror half
  //        `asReviewLevelPourAnnounce` shed that exact shape at i019, measured at ~145
  //        unbroken chars on this repo's 12-wide fixture — a wall that wraps in a
  //        terminal — and EVERY other member list in the corpus (the guard review
  //        blocks, the pour announce, the settled tree) renders one item per branch.
  // ⚠️ .note = the mirror's own comment already CLAIMED this file was one-per-branch,
  //        and the claim was false for three rounds. so the repair closes a nitpick
  //        carried since i008 (re-raised i022/r011) AND a comment that lied about it.
  //        it is a nitpick rather than a blocker because no shipped snapshot carries
  //        more than one name per side, so no committed oracle demonstrates the wall
  const branch = (args: { names: string[]; label: string }): string[] =>
    args.names.map(
      (name, position) =>
        `   ${position === 0 ? `├─ ${args.label}:` : ' '.repeat(args.label.length + 4)} ${name}`,
    );

  return [
    `🟡 level ${input.level} mixes a bounded concurrency group with an unbounded lane`,
    ...branch({ names: input.groups, label: 'bounded' }),
    ...branch({ names: input.ungrouped, label: 'unbounded' }),
    `   └─ an unbounded lane pours BESIDE the group, so the group's ratelimit`,
    `      is exceeded even though its own bound is honored. to close it, give`,
    `      each lane above a \`group:\` — or leave it, if the mix is intended`,
  ].join('\n');
};
