import type { ReviewRunMetricsRealized } from '@src/domain.objects/Reviewer/ReviewRunMetricsRealized';
import type { ReviewTokens } from '@src/domain.objects/Reviewer/ReviewTokens';

/**
 * .what = casts the on-disk token record of a realized run into the domain's four axes
 * .why = the disk names (`inputCacheCreation`, `inputCacheRead`) stay so that old run
 *        dirs still parse; the domain names (`cacheSet`, `cacheGet`) are what every
 *        reader of `ReviewTokens` speaks. the translation between them happens HERE,
 *        once — two hand-written literals let a fifth axis land on one and miss the
 *        other, with no type error, since a literal simply never reads a field it omits
 */
export const asReviewTokensFromRealized = (input: {
  tokens: ReviewRunMetricsRealized['tokens'];
}): ReviewTokens => ({
  input: input.tokens.input,
  cacheSet: input.tokens.inputCacheCreation,
  cacheGet: input.tokens.inputCacheRead,
  output: input.tokens.output,
});
