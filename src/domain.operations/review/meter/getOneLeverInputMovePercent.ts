import type { ReviewTokens } from '@src/domain.objects/Reviewer/ReviewTokens';
import { getOnePromptTokens } from '@src/domain.operations/review/getOnePromptTokens';

/**
 * .what = how far the input lever moved between two samples, as a percent of the first
 * .why = a share of the earlier per-run figure, so the reader sees "half the prompt"
 *        rather than a token delta they must divide themselves. per run, never the
 *        corpus total, since a total rises with the run count alone
 *
 * .note = a move over a zero base is undefined, so it is `null` and renders absent,
 *         never `→ flat`. a measured series keeps it out of reach today (a non-null
 *         hit rate implies a non-zero prompt), and the guard holds the law should
 *         that filter ever loosen
 */
export const getOneLeverInputMovePercent = (input: {
  first: { tokens: ReviewTokens; metered: number };
  last: { tokens: ReviewTokens; metered: number };
}): number | null => {
  // the per-run prompt tokens at each end
  const inputFirst =
    getOnePromptTokens({ tokens: input.first.tokens }) / input.first.metered;
  const inputLast =
    getOnePromptTokens({ tokens: input.last.tokens }) / input.last.metered;

  // a move over a zero base is undefined
  if (inputFirst === 0) return null;
  return ((inputLast - inputFirst) / inputFirst) * 100;
};
