/**
 * .what = the honesty census as one phrase — `3 metered · 0 refused · 2 unknown 🟡`
 *
 * .why = every aggregate is read against the share of the corpus that proved it, and one
 *        corpus must read one way at every breadth. the tree once dropped a zero bucket
 *        where the grove stated it, so `--of tree` and `--of grove` printed one census in
 *        two shapes. this is the one render both read (rule.forbid.duplicate-format-tree-operations)
 *
 * .note = all three counts are stated unconditionally. a zero is a fact the reader checks
 *         the figures against — `0 metered` is the sharpest fact a census can state, and
 *         `0 unknown` says every figure above is a full total rather than a floor
 *
 * .note = `unknown`, never `unmetered` — one declared grade, one word, at every breadth
 *         (`term=review.grade`, `F9`). it carries 🟡 only when nonzero: an unknown run is
 *         excluded from the sums above it, so the total beside it is then a floor
 */
export const asGradesWord = (input: {
  census: { metered: number; refused: number; unknown: number };
}): string => {
  const { census } = input;
  const flag = census.unknown > 0 ? ' 🟡' : '';
  return `${census.metered} metered · ${census.refused} refused · ${census.unknown} unknown${flag}`;
};
