import type { ExitCodeClass } from '../getExitCodeClass';

/**
 * .what = did the reviewer actually get its turn? — the one question the METER charges on
 * .why = a round is the scarce resource the review ladder meters, and the budget gate bounds a
 *        top-up past it (`computeBudgetGrantRefusal`). so what counts as a spent round must be
 *        one rule in one place, pinned by a test — never a two-line conjunction inline in an
 *        orchestrator, where the next author reads it as a formality.
 *
 * .the rule, in four rows:
 *
 *   | the lane | charged? | why |
 *   |---|---|---|
 *   | exit 0 — a verdict was read | ✅ | the reviewer ran and spoke |
 *   | exit 2 WITH blockers | ✅ | the reviewer ran and found issues |
 *   | exit 2 with NO blockers | 🔴 no | a genuine constraint — an absent api key, not a review |
 *   | malfunction | 🔴 no | the reviewer broke; a broken lane is not an exhausted one |
 *
 * 🔴 .THE TWIN — `asPeerGivenVerdict` reads an unreadable review the OPPOSITE way, and both are
 *    correct in their own seat:
 *
 *    | the seat | an unreadable review counts as | so that |
 *    |---|---|---|
 *    | here — the METER | 0 blockers ⇒ NOT completed | a broken lane drains no round |
 *    | `asPeerGivenVerdict` — the PASSAGE gate | 1 blocker, fabricated | a stone cannot pass on a verdict nobody read |
 *
 *    ⇒ the two ask different questions — *"did the reviewer get a turn?"* and *"may this stone
 *    pass?"* — and an unreadable review answers NO to both. the answers point opposite ways, so
 *    a 0 here and a 1 there is the agreement rather than the drift.
 *
 * ⚠️ a future edit that made the two "consistent" would break whichever gate it did not have in
 *    view: a 1 here charges a round for a review that never ran; a 0 there re-hides the
 *    malfunction as a clean bill (rule.forbid.failhide).
 *
 * .note = the zero arrives via `runOneReview`, which sets `blockers = 0` on an undetected count
 *         AND promotes an exit-0 undetected review to exit 1. so both unreadable paths land
 *         here as not-completed — one as a malfunction, one as a blocker-less constraint.
 */
export const computeReviewCompleted = (input: {
  exitClass: ExitCodeClass;
  blockers: number;
}): boolean =>
  input.exitClass === 'passed' ||
  (input.exitClass === 'constraint' && input.blockers > 0);
