/**
 * .what = the iteration marker of the guard artifact grammar: `.i`, the digits, then `.` or `p`
 * .why = a review stamps `.iNNN.`, a judge stamps `.iNNNp` (its review-iteration marker); the
 *        one capture group holds the digits. named, so a reader learns what the pattern
 *        reads from its name rather than by simulation of the regex
 *        (rule.forbid.inline-decode-friction)
 */
const PATTERN_OF_GUARD_ARTIFACT_ITERATION = /\.i(\d+)[p.]/;

/**
 * .what = reads the iteration a guard artifact's filename carries, or null if it carries none
 * .why = the guard artifact grammar stamps each artifact with an iteration marker — `.iNNN.`
 *        on a review, `.iNNNp` on a judge (its review-iteration marker). a reader who sees the
 *        regex inline must simulate both the pattern and the capture index to learn what it
 *        returns, so the parse lives here under a name that says what it reads
 *        (rule.forbid.inline-decode-friction)
 */
export const asGuardArtifactIteration = (input: {
  filename: string;
}): number | null => {
  const marker = input.filename.match(PATTERN_OF_GUARD_ARTIFACT_ITERATION)?.[1];
  if (marker === undefined) return null;
  return parseInt(marker, 10);
};
