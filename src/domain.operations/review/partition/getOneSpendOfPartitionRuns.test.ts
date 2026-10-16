import { BadRequestError } from 'helpful-errors';
import { asIsoPriceHuman } from 'iso-price';
import { given, then, when } from 'test-fns';

import type { StepReviewResult } from '@src/domain.operations/review/StepReviewResult';

import { getOneSpendOfPartitionRuns } from './getOneSpendOfPartitionRuns';

/**
 * .what = a run whose spend is measured at the given total, or unmeasured where null
 */
const asRunOfSpend = (input: {
  total: string | null;
}): { metrics: { realized: StepReviewResult['metrics']['realized'] } } => ({
  metrics: {
    realized: {
      tokens:
        input.total === null
          ? null
          : {
              input: 100,
              inputCacheCreation: 10,
              inputCacheRead: 900,
              output: 50,
            },
      cost:
        input.total === null
          ? null
          : {
              input: asIsoPriceHuman('USD 0.01'),
              cacheWrite: asIsoPriceHuman('USD 0.00'),
              cacheRead: asIsoPriceHuman('USD 0.001'),
              output: asIsoPriceHuman('USD 0.02'),
              total: asIsoPriceHuman(input.total),
            },
      time: { seconds: 1 },
    },
  },
});

describe('getOneSpendOfPartitionRuns', () => {
  given('[case1] every run measured, no fault', () => {
    const spend = getOneSpendOfPartitionRuns({
      runs: [
        asRunOfSpend({ total: 'USD 0.10' }),
        asRunOfSpend({ total: 'USD 0.20' }),
      ],
      faults: [],
    });

    when('[t0] the spend is summed', () => {
      then('each token axis sums across the runs', () => {
        expect(spend.tokens).toEqual({
          input: 200,
          inputCacheCreation: 20,
          inputCacheRead: 1800,
          output: 100,
        });
      });
      then('each cost line sums across the runs', () => {
        expect(spend.cost?.total).toEqual(asIsoPriceHuman('USD 0.30'));
        expect(spend.cost?.output).toEqual(asIsoPriceHuman('USD 0.04'));
      });
    });
  });

  given('[case2] one run unmeasured', () => {
    const spend = getOneSpendOfPartitionRuns({
      runs: [
        asRunOfSpend({ total: 'USD 0.10' }),
        asRunOfSpend({ total: null }),
      ],
      faults: [],
    });

    when('[t0] the spend is summed', () => {
      then('one unknown part makes the whole unknown — never a low sum', () => {
        expect(spend).toEqual({ tokens: null, cost: null });
      });
    });
  });

  given(
    '[case3] every run measured, and a fault that may have been billed',
    () => {
      const spend = getOneSpendOfPartitionRuns({
        runs: [asRunOfSpend({ total: 'USD 0.10' })],
        faults: [{ error: new Error('the provider overran its deadline') }],
      });

      when('[t0] the spend is summed', () => {
        then('the spend is unknown, since the fault may hold a bill', () => {
          expect(spend).toEqual({ tokens: null, cost: null });
        });
      });
    },
  );

  given('[case4] every run measured, and a fault refused before a bill', () => {
    const spend = getOneSpendOfPartitionRuns({
      runs: [asRunOfSpend({ total: 'USD 0.10' })],
      faults: [{ error: new BadRequestError('the args were refused') }],
    });

    when('[t0] the spend is summed', () => {
      then('the unbilled fault leaves the measured spend intact', () => {
        expect(spend.cost?.total).toEqual(asIsoPriceHuman('USD 0.10'));
      });
    });
  });
});
