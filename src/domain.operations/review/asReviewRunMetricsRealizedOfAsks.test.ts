import { BadRequestError } from 'helpful-errors';
import { asIsoPrice, asIsoPriceHuman } from 'iso-price';
import type { BrainSpec } from 'rhachet/brains';
import { given, then, when } from 'test-fns';

import { BASIS_OF_RUNAWAY_ASK } from '@src/domain.objects/Reviewer/ReviewRunMetricsRealized';

import { asReviewRunMetricsRealizedOfAsks } from './asReviewRunMetricsRealizedOfAsks';

/**
 * .what = a rate card with round per-token prices, so each sum reads plainly
 */
const RATES: BrainSpec['cost']['cash'] = {
  per: 'token',
  input: asIsoPrice('USD 0.000001'),
  output: asIsoPrice('USD 0.000002'),
  cache: {
    set: asIsoPrice('USD 0.000001'),
    get: asIsoPrice('USD 0.0000001'),
  },
};

/**
 * .what = the realized figures of an ask that answered: a 1,000-token prompt, 50 out
 */
const ANSWERED = {
  tokens: {
    input: 600,
    inputCacheCreation: 100,
    inputCacheRead: 300,
    output: 50,
  },
  cost: {
    input: asIsoPriceHuman('USD 0.0006'),
    cacheWrite: asIsoPriceHuman('USD 0.0001'),
    cacheRead: asIsoPriceHuman('USD 0.00003'),
    output: asIsoPriceHuman('USD 0.0001'),
    total: asIsoPriceHuman('USD 0.00083'),
  },
  time: { seconds: 3 },
};

describe('asReviewRunMetricsRealizedOfAsks', () => {
  given('[case1] no runaway ask', () => {
    when('[t0] the asks are folded', () => {
      then('the realized figures are the answer alone', () => {
        const folded = asReviewRunMetricsRealizedOfAsks({
          answered: ANSWERED,
          runaways: [],
          faults: [],
          rates: RATES,
        });
        expect(folded.realized).toEqual(ANSWERED);
        expect(folded.runaways).toEqual([]);
        expect(folded.unmeasured).toEqual(0);
      });
    });
  });

  given('[case2] one runaway ask with its output count reported', () => {
    const folded = asReviewRunMetricsRealizedOfAsks({
      answered: ANSWERED,
      runaways: [
        { provider: 'InferenceNet', generationId: 'gen-a', tokensOutput: 1000 },
      ],
      faults: [],
      rates: RATES,
    });

    when('[t0] the asks are folded', () => {
      then(
        'the runaway sent the whole prompt, priced at the full input rate',
        () => {
          // 600 + 100 + 300 = 1,000 prompt tokens; 1,000 x $0.000001 = $0.001
          expect(folded.runaways[0]?.tokens.input).toEqual(1000);
          expect(folded.runaways[0]?.cost.input).toEqual(
            asIsoPriceHuman('USD 0.001000'), // a product keeps the rate card precision
          );
        },
      );

      then('the runaway output is priced at the output rate', () => {
        // 1,000 x $0.000002 = $0.002
        expect(folded.runaways[0]?.cost.output).toEqual(
          asIsoPriceHuman('USD 0.002000'),
        );
        expect(folded.runaways[0]?.cost.total).toEqual(
          asIsoPriceHuman('USD 0.003000'),
        );
        expect(folded.runaways[0]?.basis).toEqual(BASIS_OF_RUNAWAY_ASK);
        expect(folded.runaways[0]?.supply).toEqual({
          provider: 'InferenceNet',
          generationId: 'gen-a',
        });
      });

      then('the totals bill both asks', () => {
        expect(folded.realized.tokens).toEqual({
          input: 600 + 1000,
          inputCacheCreation: 100,
          inputCacheRead: 300,
          output: 50 + 1000,
        });
        expect(folded.realized.cost.input).toEqual(
          asIsoPriceHuman('USD 0.0016'),
        );
        expect(folded.realized.cost.output).toEqual(
          asIsoPriceHuman('USD 0.0021'),
        );
        expect(folded.realized.cost.total).toEqual(
          asIsoPriceHuman('USD 0.00383'),
        );
        expect(folded.unmeasured).toEqual(0);
      });

      then('the cache axes and the time are the answer own', () => {
        expect(folded.realized.cost.cacheWrite).toEqual(
          ANSWERED.cost.cacheWrite,
        );
        expect(folded.realized.cost.cacheRead).toEqual(ANSWERED.cost.cacheRead);
        expect(folded.realized.time).toEqual(ANSWERED.time);
      });
    });
  });

  given('[case3] a runaway ask whose output count was not reported', () => {
    when('[t0] the asks are folded', () => {
      then(
        'it is counted as unmeasured, so the caller can refuse a low total',
        () => {
          const folded = asReviewRunMetricsRealizedOfAsks({
            answered: ANSWERED,
            runaways: [
              { provider: null, generationId: null, tokensOutput: null },
            ],
            faults: [],
            rates: RATES,
          });
          expect(folded.unmeasured).toEqual(1);
          expect(folded.runaways).toEqual([]);
        },
      );
    });
  });

  given(
    '[case4] a socket drop the transient retry swallowed before the answer',
    () => {
      when('[t0] the asks are folded', () => {
        then(
          '🔴 it is counted as unmeasured — the dropped ask may have been billed',
          () => {
            const folded = asReviewRunMetricsRealizedOfAsks({
              answered: ANSWERED,
              runaways: [],
              faults: [
                {
                  error: Object.assign(new Error('terminated'), {
                    code: 'UND_ERR_SOCKET',
                  }),
                },
              ],
              rates: RATES,
            });
            expect(folded.unmeasured).toEqual(1);
          },
        );
      });
    },
  );

  given(
    '[case5] a refusal the transient retry swallowed before the answer',
    () => {
      when('[t0] the asks are folded', () => {
        then('it stays measured — no brain billed a refusal', () => {
          const folded = asReviewRunMetricsRealizedOfAsks({
            answered: ANSWERED,
            runaways: [],
            faults: [
              {
                error: Object.assign(new BadRequestError('429 rate limited'), {
                  status: 429,
                }),
              },
            ],
            rates: RATES,
          });
          expect(folded.unmeasured).toEqual(0);
          expect(folded.realized).toEqual(ANSWERED);
        });
      });
    },
  );
});
