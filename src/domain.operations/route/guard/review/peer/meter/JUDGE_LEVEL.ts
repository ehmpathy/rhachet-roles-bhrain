/**
 * .what = the level number of the judge rung — the top rung of every guard's level ladder
 * .why = the judge is not a gate outside the ladder; it is the highest rung. a guarded stone's
 *        gates form one ordered ladder (peer level 1 → peer level 3 → … → judge), and a
 *        judges-only stone is simply a ladder whose sole rung is the judge. once the judge is a
 *        real level, overrule, unlock, and passage treat it with no special-case branch: an
 *        overrule of the judge is just an overrule of its rung, and the old stone-wide
 *        "forgive every level and the judge at once" skeleton key disappears
 *        (see define.review.human-forgiveness.md).
 *
 * .note = a fixed max-safe sentinel guarantees the judge sits above every real peer level, which
 *         are arbitrary positive integers read from the guard filenames (1, 3, …). the ladder
 *         sorts low-to-high, so the judge is always last.
 */
export const JUDGE_LEVEL = Number.MAX_SAFE_INTEGER;
