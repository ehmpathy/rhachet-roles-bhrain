import type { ReviewRunGrade } from '@src/domain.objects/Reviewer/ReviewRunMeter';

/**
 * .what = how many runs fell into each honesty grade
 * .why = 🔴 the meter's central law: an unrecorded run must never read as a $0.00 run.
 *        so every aggregate carries the grade census beside it, and a reader can see
 *        what share of the corpus the figure is actually built from
 *
 * .note = 🔴 a `Record<ReviewRunGrade, number>`, never a hand-listed triple. the
 *         hand-listed form compiles fine when a FOURTH grade joins the union — the
 *         census simply stops to count it, and every share it feeds reads high by
 *         exactly the runs it dropped, in silence (rule.forbid.failhide).
 *
 *         as a `Record`, a fourth grade fails to typecheck at the fold and at every
 *         literal that builds one. that is the same decompose-for-recompose shape
 *         `KEY_OF_AXIS` / `LABEL_OF_ABSENT_KEY` take for `GroveAxis`, applied to the
 *         axis this branch actually recurred on.
 */
export type GradeCensus = Record<ReviewRunGrade, number>;

/**
 * 🔴 the census with every grade at nil — the identity of the fold.
 *
 * .why = it is `Record`-typed too, so it is the second site a fourth grade reds.
 *        a caller that needs an empty census must not hand-write `{metered: 0, …}`,
 *        which is precisely the hand-listed triple the type above exists to refuse.
 */
export const CENSUS_NIL: Readonly<GradeCensus> = Object.freeze({
  metered: 0,
  refused: 0,
  unknown: 0,
});

/**
 * .what = counts each run into its honesty grade
 * .why = the census travels beside every aggregate, so a rate is always read
 *        against the share of the corpus that could prove it
 *
 * .note = 🔴 it sits at `review/` rather than in `grove/` or `meter/` because BOTH
 *         breadths fold the same three grades, and for a full round they did it two
 *         ways: `grove/` called this, `meter/` hand-rolled three `.filter().length`
 *         passes over the identical grade set. the two agreed by coincidence of
 *         authorship, never by construction — so a fourth grade added to
 *         `ReviewRunGrade` would have been counted at whichever site its author had
 *         open, and the other breadth would have dropped it in silence
 *         (rule.prefer.most-common-denominator).
 *
 *         ⚠️ that is the branch's most recurrent defect species, a seventh time:
 *         an extraction binds only the call sites someone remembered to wire. here
 *         the extraction existed and `meter/` was never wired to it.
 *
 * .note = it takes the RUNS, not a plucked grade list, so no caller projects
 *         `runs.map((one) => one.grade)` inline — three sites did, and each was
 *         one more unnamed step between "the runs" and "their census"
 */
export const getOneGradeCensus = (input: {
  runs: { grade: ReviewRunGrade }[];
}): GradeCensus =>
  input.runs.reduce<GradeCensus>(
    (census, one) => ({ ...census, [one.grade]: census[one.grade] + 1 }),
    // spread, never the frozen nil itself, so an empty fold hands back a fresh census
    // rather than the shared constant (the convention every peer fold keeps)
    { ...CENSUS_NIL },
  );
