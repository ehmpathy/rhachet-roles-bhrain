import type { ReviewRunMetricsRealized } from '@src/domain.objects/Reviewer/ReviewRunMetricsRealized';
import type { ReviewTokens } from '@src/domain.objects/Reviewer/ReviewTokens';

/**
 * .what = casts the domain's four token axes back into the on-disk record of a realized run
 * .why = the inverse of `asReviewTokensFromRealized`. a fold that sums in the domain shape
 *        returns to the disk shape here, once — so the two names of each axis meet at one
 *        pair of casts, never at a hand-written literal per call site
 */
export const asRealizedTokensFromReviewTokens = (input: {
  tokens: ReviewTokens;
}): ReviewRunMetricsRealized['tokens'] => ({
  input: input.tokens.input,
  inputCacheCreation: input.tokens.cacheSet,
  inputCacheRead: input.tokens.cacheGet,
  output: input.tokens.output,
});
