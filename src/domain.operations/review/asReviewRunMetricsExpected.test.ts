import { asIsoPriceHuman } from 'iso-price';
import { given, then, when } from 'test-fns';

import { asReviewRunMetricsExpected } from './asReviewRunMetricsExpected';

describe('asReviewRunMetricsExpected', () => {
  given('[case1] a run with counts and a compiled prompt', () => {
    when('[t0] the expected metrics are built', () => {
      const metrics = asReviewRunMetricsExpected({
        files: { rules: 3, refs: 1, conversation: 2, targets: 42 },
        compiled: {
          tokenEstimate: 12_345,
          contextWindowPercent: 9,
          costEstimate: asIsoPriceHuman('USD 0.0123'),
        },
      });

      then('each count lands under its own artifact field', () => {
        expect(metrics.files).toEqual({
          rulesCount: 3,
          refsCount: 1,
          conversationCount: 2,
          targetsCount: 42,
        });
      });

      then(
        'each estimate is carried from the compiled prompt unchanged',
        () => {
          expect(metrics.tokens).toEqual({
            estimate: 12_345,
            contextWindowPercent: 9,
          });
          expect(metrics.cost).toEqual({
            estimate: asIsoPriceHuman('USD 0.0123'),
          });
        },
      );
    });
  });
});
