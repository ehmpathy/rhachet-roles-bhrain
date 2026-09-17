/**
 * .what = composes the one liveness line a level's pour announces, or null
 *         where the pour needs none
 *
 * .why = the live status line is suppressed entirely under a pipe. that is a
 *        declared, clamped deviation with real arithmetic behind it — SPIN_MS is
 *        80ms against a PT21M timeout, so a per-tick append is ~15,750 lines on
 *        one level (`genContextCliEmit.drawStatus`). but the suppression took
 *        the ANNOUNCEMENT with it, so a piped log went byte-silent from a
 *        level's launch to its settle — and a reader could not part "this level
 *        is slow" from "this level never began".
 *
 * .why = that tradeoff had been priced as a binary — spam or silence — and a
 *        third option was never weighed: ONE line per level, O(1) rather than
 *        O(ticks). raised i009/r10, point 1.
 *
 * 🔴 .why = it composes from the DECLARED roster, before any lane launches, and
 *         that is the whole reason it is a leaf here rather than an emit-path
 *         line. two measured facts forced it:
 *
 *         1. a per-LANE announce on the emit path is a settle RACE. a lane that
 *            contends only for its level slot launches ahead of a grouped one,
 *            so the announce order varies with the scheduler. measured on
 *            `driver.route.peer-concurrency [t5]`, which announced `r9` before
 *            `r5` where the declared order is the reverse. that is the exact
 *            hazard `genReviewWaveBuffer` exists to close (fulcrum F9),
 *            reintroduced on a path that bypasses the buffer
 *
 *         2. `route.ts` hands the emit `process.stdout`, so any byte written
 *            there is captured by the frozen peer snapshots. seven extant
 *            fixtures have a multi-member level, so an emit-path line moves
 *            seven oracles that this change otherwise leaves alone
 *
 *         ⇒ the roster is ordered and complete before the first launch, so a
 *         line composed here cannot race; and the caller writes it to genuine
 *         stderr, which no oracle reads. both defects close at once
 *
 * 🟡 .bound = it closes the SILENCE and not an inactivity KILL. a level
 *         announces once, at t≈0, and the log is quiet thereafter — so a runner
 *         that reaps a job with no output for N minutes still reaps it. that
 *         wants a heartbeat on a cadence decoupled from SPIN_MS, which is a
 *         judgment rather than a ride-along: carried as fulcrum F15
 *
 * .note = a zero-member level returns null — there is no pour to announce.
 *         a single-member level announces, because the slotted emit path seals
 *         NO header at inflight (`genContextCliEmit.ts: wave.launch(…); return`)
 *         — only the settled block arrives. under a pipe `drawStatus` also
 *         returns immediately (no tty), so without the announce a single-member
 *         level is byte-silent from launch to settle, and a reader cannot part
 *         "this level is slow" from "this level never began"
 */
export const asReviewLevelPourAnnounce = (input: {
  /** the level about to pour */
  level: number;
  /** its members, in DECLARED order */
  members: { index: number; slug: string }[];
  /** the level's own bound, or null where it declared none */
  concurrency: number | null;
}): string | null => {
  // no members — no pour to announce
  if (input.members.length === 0) return null;

  // the bound, where one was declared — a reader who sees `≤1 at a time` knows
  // a serial pour is the valve at work rather than the feature absent
  const bound =
    input.concurrency === null ? '' : ` · ≤${input.concurrency} at a time`;

  // 🔴 ONE MEMBER PER BRANCH, never a comma-joined line
  // .why = the roster was `join(', ')` on one line until i019. at this repo's own
  //        12-wide fixture that rendered ~145 unbroken chars, which wraps in a terminal
  //        and reads as a wall — while every other member list in the corpus (the guard
  //        review blocks, the settled tree) renders one item per branch. so the one line
  //        a driver reads at a level's launch broke the convention
  //        (`rule.forbid.snapshot-visual-blemishes`).
  // ⚠️ .note = this comment read "EVERY other member list … the leak advisory …" until
  //        i022, and that was FALSE — `asConcurrencyGroupLeakAdvisory` still carried
  //        `join(', ')` on both of its lines. it was repaired in the same round the
  //        claim was, so the two mirror halves now genuinely agree. ⇒ the lesson the
  //        pair carries: a comment that asserts a property of ANOTHER file is a claim
  //        with no oracle behind it, and it decayed without one edit to this file
  // ⚠️ .note = the wide shape is the PRODUCTION shape, never an edge — this repo's own
  //        `5.3.verification` l1 carries 9 members. raised across i014–i017 before it
  //        was repaired here
  const roster = input.members.map((member, position) => {
    const isLast = position === input.members.length - 1;
    return `   ${isLast ? '└─' : '├─'} r${member.index}:${member.slug}`;
  });

  const count = input.members.length;
  const noun = count === 1 ? 'lane' : 'lanes';
  return [`🦉 l${input.level} pours ${count} ${noun}${bound}`, ...roster].join(
    '\n',
  );
};
