/**
 * .what = the chars a set of locus rows carries, summed
 * .why = the per-input mass every target split row renders and shares against; a
 *        named sum, so the renderer reads as a list of rows rather than a fold a
 *        reader must simulate (rule.forbid.inline-decode-friction)
 */
export const getOneLocusChars = (input: {
  rows: { chars: number }[];
}): number => input.rows.reduce((total, row) => total + row.chars, 0);
