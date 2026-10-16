import { getOnePromptTokens } from '@src/domain.operations/review/getOnePromptTokens';

/**
 * .what = the share of the PROMPT that a cache served — cacheGet / prompt tokens
 * .why = 🔴 the headline cache figure, and every surface on the `--of` axis prints
 *        it. the denominator has one home (`getOnePromptTokens`); so does the
 *        arithmetic over it. two expressions of one formula, with guards that read in
 *        opposite polarity, look unalike enough that no reader compares them — the
 *        shape a drift hides in (rule.require.single-source-of-truth-for-render).
 *
 *        it sits at `review/` beside `getOnePromptTokens`, for the same reason: peers
 *        in `meter/` and `grove/` both read it, so its home is their common
 *        ancestor (rule.prefer.most-common-denominator).
 *
 * .note = 🔴 a zero denominator yields `null`, never `0`. a bucket that sent no
 *         prompt token has an UNDEFINED hit rate; a `0.0%` there states "a cache
 *         served none of it" as a measured fact, where the truth is that there was
 *         naught to serve. that is the branch's central law applied to a rate
 *         (rule.forbid.failhide), and it is why the return is nullable at all.
 */
export const getOneCacheHitRate = (input: {
  tokens: { input: number; cacheSet: number; cacheGet: number };
}): number | null => {
  const prompt = getOnePromptTokens({ tokens: input.tokens });
  if (prompt === 0) return null;
  return input.tokens.cacheGet / prompt;
};
