import type { ReviewTokens } from '@src/domain.objects/Reviewer/ReviewTokens';

/**
 * .what = the sum of all four disjoint token axes of one `ReviewTokens`
 * .why = input, cache set, cache get, and output never overlap, so their sum is the
 *        total. it reads the DOMAIN shape only: a realized run is cast first
 *        (`asReviewTokensFromRealized`), so the axis list lives in one shape and the
 *        sum is never re-derived over the disk names
 *
 * .note = a COUNT, one number of one record. its peer `getOneReviewTokensOfRuns`
 *         folds many runs into one `ReviewTokens` and keeps the four axes apart
 */
export const getOneReviewTokensCount = (input: {
  tokens: ReviewTokens;
}): number =>
  input.tokens.input +
  input.tokens.cacheSet +
  input.tokens.cacheGet +
  input.tokens.output;
