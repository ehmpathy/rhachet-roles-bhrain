/**
 * .what = the tokens an axis paid FULL RATE for — input plus cache writes
 * .why = declared once, in one file, because the rollup SORTS on it and the renderer
 *        DISPLAYS it. two expressions of one quantity can disagree — a sort that adds
 *        `output` where the display does not ranks a smaller row above a larger one,
 *        and reads as a broken sort. a quantity two readers share belongs beside
 *        neither (rule.require.single-responsibility).
 *
 * .note = both callers live in `grove/`, so `grove/` is its common ancestor. it moves
 *         up to `review/` when a caller outside `grove/` reads it, and not before
 *         (rule.prefer.most-common-denominator)
 *
 * .note = the input is narrowed to the two axes it may read, so cache.get and output
 *         are not merely excluded by the body — they are UNREACHABLE from the signature.
 *         the note below explains WHY they are excluded; this shape is what stops a later
 *         edit from a quiet re-inclusion of one.
 *
 * .note = cache.get is excluded deliberately. it is read at 1/31.4 the price, so to
 *         include it would rank a cheap lane as though it were dear — and the whole
 *         point of the rollup is to aim a cut.
 *
 * .note = it is named for the RATE, never `billable`. cache.get is billed — at 1/31.4,
 *         never at nil — so a column that excluded it under `billable` would state fewer
 *         tokens billed than were. the token block beside it renders `at full rate` for
 *         input and `31.4x cheaper` for cache.get, and the name agrees with that
 *         (rule.forbid.ambiguous-labels)
 */
export const getOneFullRateTokens = (input: {
  tokens: { input: number; cacheSet: number };
}): number => input.tokens.input + input.tokens.cacheSet;
