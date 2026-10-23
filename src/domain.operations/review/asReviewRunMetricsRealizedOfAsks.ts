import { asIsoPriceHuman, priceMultiply, priceSum } from 'iso-price';
import type { BrainSpec } from 'rhachet/brains';

import {
  BASIS_OF_RUNAWAY_ASK,
  type ReviewRunMetricsRealized,
  type ReviewRunRunawayAsk,
} from '@src/domain.objects/Reviewer/ReviewRunMetricsRealized';
import type { ReviewTokens } from '@src/domain.objects/Reviewer/ReviewTokens';
import { asRealizedTokensFromReviewTokens } from '@src/domain.operations/review/asRealizedTokensFromReviewTokens';
import { asReviewTokensFromRealized } from '@src/domain.operations/review/asReviewTokensFromRealized';
import { getOneReviewCostsSummed } from '@src/domain.operations/review/getOneReviewCostsSummed';
import { getOneReviewTokensOfPrompt } from '@src/domain.operations/review/getOneReviewTokensOfPrompt';
import { getOneReviewTokensSummed } from '@src/domain.operations/review/getOneReviewTokensSummed';
import { isFaultOfUnbilledCall } from '@src/domain.operations/review/isFaultOfUnbilledCall';
import type { ReviewRunawayEvidence } from '@src/domain.operations/review/withOutputLimitBrainRetry';

type ReviewRunMetricsRealizedTotals = Omit<
  ReviewRunMetricsRealized,
  'compiled' | 'supply' | 'runaways'
>;

/**
 * .what = a run's realized figures over EVERY ask it billed: the ask that answered, plus
 *         each ask whose reply ran to the output limit before it
 * .why = a runaway ask bills its whole output limit and returns no answer, so the brain's
 *        answer carries only the ask that answered. a meter that read that answer alone
 *        would under-report the run by the runaway's spend — 131,072 output tokens a time
 *        on `deepseek/flash`. so each runaway is priced and summed into the totals, and
 *        listed beside them for attribution
 *
 * .note = a runaway's input is the answered ask's prompt token count (the same prompt was
 *         sent), priced at the full input rate: its cache split is unreported, and a cache
 *         hit would only have cost less, so the figure is an upper bound, never an under-read
 * .note = a runaway whose output count the brain package did not report cannot be priced;
 *         it is counted in `unmeasured`, so the caller can refuse to state a total at all
 *         rather than state a low one
 * .note = 🔴 a fault a transient retry swallowed is counted in `unmeasured` too, unless no
 *         brain billed it (`isFaultOfUnbilledCall`). a socket that closed mid-stream may close
 *         after the provider billed, and that ask reports no figures, so a total that read
 *         the answer alone would read low
 */
export const asReviewRunMetricsRealizedOfAsks = (input: {
  answered: ReviewRunMetricsRealizedTotals;
  runaways: ReviewRunawayEvidence[];
  /** each fault a transient retry swallowed before the ask that answered */
  faults: { error: unknown }[];
  rates: BrainSpec['cost']['cash'];
}): {
  realized: ReviewRunMetricsRealizedTotals;
  runaways: ReviewRunRunawayAsk[];
  unmeasured: number;
} => {
  // the prompt each runaway sent: the answered ask's full prompt token count, cast once to
  // the domain axes so the axis list lives in one shape
  const tokensPrompt = getOneReviewTokensOfPrompt({
    tokens: asReviewTokensFromRealized({ tokens: input.answered.tokens }),
  });

  // price each runaway whose output count was reported
  const runaways = input.runaways
    .filter((evidence) => evidence.tokensOutput !== null)
    .map((evidence) =>
      asReviewRunRunawayAsk({
        evidence,
        tokensPrompt,
        tokensOutput: evidence.tokensOutput ?? 0,
        rates: input.rates,
      }),
    );
  // an ask is unmeasured where it was billed with no reported spend: a runaway with no
  // output count, or a swallowed fault that may have been billed
  const faultsBillable = input.faults.filter(
    (fault) => !isFaultOfUnbilledCall(fault),
  );
  const unmeasured =
    input.runaways.length - runaways.length + faultsBillable.length;

  // sum the runaways into the answered totals through the one token fold; the runaway
  // input lands on the full-rate axis, since its cache split is unreported
  const realized: ReviewRunMetricsRealizedTotals = {
    tokens: asRealizedTokensFromReviewTokens({
      tokens: getOneReviewTokensSummed({
        tokens: [
          asReviewTokensFromRealized({ tokens: input.answered.tokens }),
          ...runaways.map(asReviewTokensOfRunawayAsk),
        ],
      }),
    }),
    cost: getOneReviewCostsSummed({
      costs: [input.answered.cost, ...runaways.map(asReviewCostOfRunawayAsk)],
    }),
    time: input.answered.time,
  };
  return { realized, runaways, unmeasured };
};

/**
 * .what = prices one runaway ask off the brain's rate card
 * .why = one named cast, so the fold reads "price this ask" rather than a multiply to simulate
 */
const asReviewRunRunawayAsk = (input: {
  evidence: ReviewRunawayEvidence;
  tokensPrompt: number;
  tokensOutput: number;
  rates: BrainSpec['cost']['cash'];
}): ReviewRunRunawayAsk => {
  const costInput = priceMultiply({
    of: input.rates.input,
    by: input.tokensPrompt,
  });
  const costOutput = priceMultiply({
    of: input.rates.output,
    by: input.tokensOutput,
  });
  return {
    supply: {
      provider: input.evidence.provider,
      generationId: input.evidence.generationId,
    },
    tokens: { input: input.tokensPrompt, output: input.tokensOutput },
    cost: {
      input: asIsoPriceHuman(costInput),
      output: asIsoPriceHuman(costOutput),
      total: asIsoPriceHuman(priceSum([costInput, costOutput])),
    },
    basis: BASIS_OF_RUNAWAY_ASK,
  };
};

/**
 * .what = casts one runaway ask's tokens onto the four domain axes
 * .why = a runaway reports only input and output, so its cache axes are zero; the cast lets
 *        it enter the one token fold (`getOneReviewTokensSummed`) beside the answered ask
 */
const asReviewTokensOfRunawayAsk = (
  ask: ReviewRunRunawayAsk,
): ReviewTokens => ({
  input: ask.tokens.input,
  cacheSet: 0,
  cacheGet: 0,
  output: ask.tokens.output,
});

/**
 * .what = casts one runaway ask's cost onto the five realized cost lines
 * .why = a runaway is priced at the full input rate, so its cache lines are nil; the cast
 *        lets it enter the one cost fold (`getOneReviewCostsSummed`) beside the answered ask
 */
const asReviewCostOfRunawayAsk = (
  ask: ReviewRunRunawayAsk,
): ReviewRunMetricsRealizedTotals['cost'] => ({
  input: ask.cost.input,
  cacheWrite: asIsoPriceHuman('USD 0'),
  cacheRead: asIsoPriceHuman('USD 0'),
  output: ask.cost.output,
  total: ask.cost.total,
});
