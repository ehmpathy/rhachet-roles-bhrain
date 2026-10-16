import { given, then, when } from 'test-fns';

import { getOneReviewMetricsOfZero } from './getOneReviewMetricsOfZero';

describe('getOneReviewMetricsOfZero', () => {
  given('[case1] a run that called no brain', () => {
    when('[t0] its metrics are read', () => {
      const metrics = getOneReviewMetricsOfZero();

      then('every count and token is zero', () => {
        expect(Object.values(metrics.files)).toEqual([0, 0, 0, 0]);
        // a null tokens record (unmeasured) would drop its four counts and fail the match
        expect(Object.values(metrics.realized.tokens ?? {})).toEqual([
          0, 0, 0, 0,
        ]);
        expect(metrics.expected.tokens).toEqual({
          estimate: 0,
          contextWindowPercent: 0,
        });
      });

      then('every price is a real zero, never absent', () => {
        const prices = [
          metrics.expected.cost.estimate,
          // a null cost (unmeasured) would drop its five prices and fail the count below
          ...Object.values(metrics.realized.cost ?? {}),
        ];
        expect(prices).toHaveLength(6);
        prices.forEach((price) => expect(price).toEqual('$0.00'));
      });

      then('the metrics match the snapshot', () => {
        expect(metrics.realized.time).toEqual('PT0S');
        expect(metrics.files.targetsCount).toEqual(0);
        expect(metrics).toMatchSnapshot();
      });
    });
  });
});
