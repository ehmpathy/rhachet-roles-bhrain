import type { ReviewTokens } from '@src/domain.objects/Reviewer/ReviewTokens';
import { getOneReviewTokensCount } from '@src/domain.operations/review/getOneReviewTokensCount';

/**
 * .what = the tokens one ask's prompt held — every axis of a `ReviewTokens` but output
 * .why = derived from the one count over all axes, less output, so a new input-side axis
 *        (a second cache tier) joins the prompt figure the moment it joins the count —
 *        never left out of a hand-written sum of the axes known today
 */
export const getOneReviewTokensOfPrompt = (input: {
  tokens: ReviewTokens;
}): number =>
  getOneReviewTokensCount({ tokens: input.tokens }) - input.tokens.output;
