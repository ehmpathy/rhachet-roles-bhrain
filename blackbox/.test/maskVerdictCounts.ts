/**
 * .what = masks a live reviewer's blocker/nitpick counts out of a snapshot
 * .why = a concern count is the one field in a review tree a real llm decides, so a snapshot
 *        that pins it is a fixture over a probabilistic value — `when.repeatably` does not
 *        save it, since `SOME` re-drives the run and every attempt asks the same brain
 *        the same question, so a shifted modal verdict fails all three.
 *
 * .note = apply per case, never suite-wide, and the asymmetry is the whole point:
 *
 *            | the case | is the count the contract? | mask |
 *            |---|---|---|
 *            | a **findings** case | no — the contract is *"≥1 blocker ⇒ the guard blocks"*, and the exact tally is the brain's | mask |
 *            | a **pass** case | yes — `0 blockers` is what *"clean code passes"* means, and the snapshot is its only proof | never |
 *
 *        a suite-wide mask leaves a snapshot that cannot part a pass from a reject — the
 *        two pass cases' `0 blockers ✓` would read `[N] blockers ✓`.
 *
 *        on a findings case no structural claim is lost. what the peer bit is still proven
 *        three ways that survive the mask: the `🦉 needs your talons` verdict word, the
 *        judge's `blockers exceed threshold ([N] > 0)` — whose `> 0` bound is kept
 *        deliberately — and `passage = blocked` / `exit code: 2 ✋`.
 *
 * .note = the glyph beside a masked count is masked too. `🟠` vs `✓` (and an absent glyph)
 *         keys on whether the count is zero, so a kept glyph leaks the variance the mask hides.
 *
 * .note = a peer `N/3` budget slot is not masked — that is the guard's own arithmetic,
 *         which is deterministic, and it sits in a different shape (`(l1, 1/3)`) than a
 *         concern tally.
 */
export const maskVerdictCounts = (text: string): string =>
  text
    .replace(/\b\d+ blockers?\b/g, '[N] blockers')
    .replace(/\b\d+ nitpicks?\b/g, '[N] nitpicks')
    .replace(
      /\[N\] (blockers|nitpicks)(?: (?:🔴|🟠|✓))?(?=\n|"|$)/g,
      '[N] $1 [GLYPH]',
    )
    .replace(/\bthreshold \(\d+ > (\d+)\)/g, 'threshold ([N] > $1)');
