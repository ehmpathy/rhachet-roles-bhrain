import { asIsoPriceHuman } from 'iso-price';

import { asReviewRunArgsMetricsOfExpected } from '@src/domain.operations/review/asReviewRunArgsMetricsOfExpected';

describe('asReviewRunArgsMetricsOfExpected', () => {
  test('the replay triple carries the expected figures, value for value', () => {
    const triple = asReviewRunArgsMetricsOfExpected({
      expected: {
        files: {
          rulesCount: 2,
          refsCount: 0,
          conversationCount: 1,
          targetsCount: 9,
        },
        tokens: { estimate: 1500, contextWindowPercent: 12 },
        cost: { estimate: asIsoPriceHuman('USD 0.0045') },
      },
    });
    expect(triple).toEqual({
      tokenEstimate: 1500,
      contextWindowPercent: 12,
      costEstimate: asIsoPriceHuman('USD 0.0045'),
    });
  });
});
