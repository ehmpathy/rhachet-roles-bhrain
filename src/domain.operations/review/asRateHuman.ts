import { asPercentHuman } from './asPercentHuman';

/**
 * .what = renders a rate as a percentage to one decimal, or the caller's
 *         absent mark where the rate could not be computed
 *
 * .why = a rate with no denominator renders as absent, never `0.0%` — a zero
 *        says "we measured none", absent says "we could not measure", and
 *        only one is true (`rule.forbid.failhide`).
 *
 * .why = lives here, at the ancestor of `meter/` and `grove/`, since the
 *        render is one act — each once wrote it out verbatim as
 *        `asCacheRateHuman` and `asShare`
 *        (`rule.require.single-source-of-truth-for-render`).
 *
 * .note = the absent mark is the caller's, deliberately: tree-shaped
 *         surfaces print `MARK_OF_ABSENT`, the grove prints `WORD_OF_ABSENT`
 *         — a declared divergence, so only the act folds here, not the glyph.
 */
export const asRateHuman = (input: {
  of: number | null;
  absent: string;
}): string =>
  input.of === null ? input.absent : asPercentHuman({ of: input.of * 100 });
