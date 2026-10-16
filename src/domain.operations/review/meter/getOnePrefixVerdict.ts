import type { ReviewTokens } from '@src/domain.objects/Reviewer/ReviewTokens';
import { getOnePromptTokens } from '@src/domain.operations/review/getOnePromptTokens';
import type { ReviewPrefixVerdict } from '@src/domain.operations/review/meter/ReviewPrefixPair';

/**
 * .what = the chars per token a run with no measured ratio is read at
 * .why = the ratio varies by corpus, so a run's own ratio is preferred; this is the
 *        fallback where the run carries no tokens or no chars to derive one from
 */
const CHARS_PER_TOKEN_FALLBACK = 4;

/**
 * .what = the reach past which a cache read exceeds the shared prefix
 * .why = the expected side is an estimate at a derived chars-per-token ratio, so a
 *        read a hair above it is noise; five points of headroom keeps a rounded
 *        estimate from read as a model violation
 */
const REACH_OF_OVER = 1.05;

/**
 * .what = whether a run's cache read came from its own earlier turns
 * .why = a multi-turn run reports its LAST turn, so a continuation turn bills `input`
 *        near zero and `cacheGet` near the whole prompt — turn one put it there moments
 *        before. to divide that read by a cross-round prefix compares it to an
 *        unrelated prior round. a genuine cross-round hit cannot look like this: its
 *        prefix ends where the round's own edits begin
 */
const isRunSelfCached = (input: { tokens: ReviewTokens }): boolean => {
  const promptTokens = getOnePromptTokens({ tokens: input.tokens });
  if (promptTokens === 0 || input.tokens.cacheGet === 0) return false;
  return (
    input.tokens.cacheGet / promptTokens > 0.9 &&
    input.tokens.input / promptTokens < 0.05
  );
};

/**
 * .what = the chars per token of a run, from the run itself where it can be measured
 * .why = a hardcoded ratio over-states or under-states reach by corpus; the run's own
 *        `promptChars / promptTokens` is the ratio its bill was taken at
 */
const getOneCharsPerToken = (input: {
  promptChars: number | null;
  tokens: ReviewTokens | null;
}): number => {
  if (input.tokens === null || !input.promptChars)
    return CHARS_PER_TOKEN_FALLBACK;
  const promptTokens = getOnePromptTokens({ tokens: input.tokens });
  if (promptTokens === 0) return CHARS_PER_TOKEN_FALLBACK;
  return input.promptChars / promptTokens;
};

/**
 * .what = a round's expected cache read, its detected one, their reach, and the verdict
 * .why = the decision that parts a layout break from a cache miss, in one pure place,
 *        so the run, tree, and grove breadths cannot grade one pair two ways
 *
 * .note = every figure that cannot be measured answers null: a prompt not on disk has no
 *         shared prefix, and an unmetered round has no cache read
 */
export const getOnePrefixVerdict = (input: {
  /** the shared prefix in chars — null where a prompt is not on disk */
  sharedChars: number | null;
  /** this round's prompt chars — null where its census could not be read */
  promptChars: number | null;
  /** this round's tokens — null where the round is not metered */
  tokens: ReviewTokens | null;
}): {
  expectedTokens: number | null;
  detectedTokens: number | null;
  reach: number | null;
  verdict: ReviewPrefixVerdict | null;
} => {
  // the expected half stands on the prompts alone
  const expectedTokens =
    input.sharedChars === null
      ? null
      : Math.round(input.sharedChars / getOneCharsPerToken(input));
  const detectedTokens = input.tokens?.cacheGet ?? null;

  // no verdict where either half is unmeasured
  if (
    input.tokens === null ||
    expectedTokens === null ||
    detectedTokens === null
  )
    return { expectedTokens, detectedTokens, reach: null, verdict: null };

  // a multi-turn run read its own turns; no cross-round reach to state
  if (isRunSelfCached({ tokens: input.tokens }))
    return {
      expectedTokens,
      detectedTokens,
      reach: null,
      verdict: 'self-cached',
    };

  // no shared prefix: the cache had no chance, or it read bytes no prefix holds
  if (expectedTokens === 0)
    return {
      expectedTokens,
      detectedTokens,
      reach: null,
      verdict: detectedTokens > 0 ? 'over-reach' : 'unshared',
    };

  // a shared prefix: the reach grades the read against it
  const reach = detectedTokens / expectedTokens;
  return {
    expectedTokens,
    detectedTokens,
    reach,
    verdict: asVerdictOfReach({ reach, detectedTokens }),
  };
};

/**
 * .what = the verdict of a round whose prefix was shared, by its reach
 * .why = three outcomes over one figure, named so the composer above reads plainly
 */
const asVerdictOfReach = (input: {
  reach: number;
  detectedTokens: number;
}): ReviewPrefixVerdict => {
  if (input.detectedTokens === 0) return 'missed';
  if (input.reach > REACH_OF_OVER) return 'over-reach';
  return 'served';
};
