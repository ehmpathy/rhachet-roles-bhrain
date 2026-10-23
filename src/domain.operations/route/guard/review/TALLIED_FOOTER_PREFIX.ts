/**
 * .what = the shared prefix of the persisted "tallied by reviewer@$brain" footer line
 * .why = ONE constant referenced by the writer (formatArtifactFooters), the render
 *        (formatGuardReviewerTree), and the reader (getOneTalliedFooterLineFromContent) — so a
 *        copy tweak to the rendered phrase moves the parse contract in lockstep and cannot
 *        silently break recovery on a cache re-read (rule.require.single-source-of-truth-for-render)
 */
export const TALLIED_FOOTER_PREFIX = 'tallied by reviewer@';
