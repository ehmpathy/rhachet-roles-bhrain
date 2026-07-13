/**
 * .what = casts a guard artifact counter (iteration, index) to its zero-padded
 *         filename segment digits, fixed width
 * .why = guard filenames embed counters (i$n, r$n); a plain lexical sort of those
 *        filenames scrambles double-digit counters (i10 < i2, r10 < r2). a fixed
 *        pad width makes lexical order equal numeric order by construction, so
 *        every consumer (globs, sorts, parsers) stays correct without a bespoke
 *        comparator. this transformer is the single source of the pad width.
 *
 * .note = width 3 supports up to 999 rounds/reviewers; parseInt on the padded
 *         digits recovers the number, so numeric parsers are unaffected.
 */
const COUNTER_WIDTH = 3;

export const asStoneGuardCounter = (input: { value: number }): string =>
  String(input.value).padStart(COUNTER_WIDTH, '0');
