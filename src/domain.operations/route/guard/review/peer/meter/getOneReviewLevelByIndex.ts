/**
 * .what = the level of review index N, or level 1 where the map holds no entry for N
 * .why = a review file can carry an index the current guard no longer declares — a retired
 *        reviewer's artifact, or a filename with no `.rN.` marker. every site that reads the
 *        level map owes one answer for that miss, so the fallback lives here, once, rather
 *        than as a `?? 1` at each call site (rule.require.review-standardization-at-parse)
 *
 * .note = level 1 is the floor every guard declares, so an unmapped file is graded against
 *         the level that always exists — it is kept unless level 1 itself was overruled
 */
export const LEVEL_OF_UNMAPPED_REVIEW = 1;

export const getOneReviewLevelByIndex = (input: {
  levels: Map<number, number>;
  index: number;
}): number => input.levels.get(input.index) ?? LEVEL_OF_UNMAPPED_REVIEW;
