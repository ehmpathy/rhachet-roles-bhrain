import type { ReviewTokens } from '@src/domain.objects/Reviewer/ReviewTokens';

/**
 * .what = the zero of the four disjoint token axes
 * .why = the seed of every token fold, declared once so no fold seeds a fifth axis
 *
 * .note = frozen, and spread at the seed, like `CENSUS_NIL` — an empty fold must
 *         never hand a caller the shared module object by identity
 */
const TOKENS_NIL: Readonly<ReviewTokens> = Object.freeze({
  input: 0,
  cacheSet: 0,
  cacheGet: 0,
  output: 0,
});

/**
 * .what = sums a set of `ReviewTokens` axis by axis
 * .why = 🔴 the one law for a token sum. every fold — the meter's runs, the grove's runs, a
 *        split lane's partitions — casts to `ReviewTokens` and sums here, so a fifth axis
 *        is summed once, never re-derived beside a second fold that misses it
 */
export const getOneReviewTokensSummed = (input: {
  tokens: ReviewTokens[];
}): ReviewTokens =>
  input.tokens.reduce(
    (sum, one) => ({
      input: sum.input + one.input,
      cacheSet: sum.cacheSet + one.cacheSet,
      cacheGet: sum.cacheGet + one.cacheGet,
      output: sum.output + one.output,
    }),
    { ...TOKENS_NIL },
  );
