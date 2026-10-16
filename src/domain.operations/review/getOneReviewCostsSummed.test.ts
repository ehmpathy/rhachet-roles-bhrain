import { asIsoPriceHuman } from 'iso-price';
import { given, then, when } from 'test-fns';

import { getOneReviewCostsSummed } from './getOneReviewCostsSummed';

/**
 * .what = a realized cost whose five lines are each a distinct multiple of a unit, so a
 *         fold that sums one line into another reads a wrong figure
 */
const asCostOfUnit = (unit: number) => ({
  input: asIsoPriceHuman(`USD ${(1 * unit).toFixed(2)}`),
  cacheWrite: asIsoPriceHuman(`USD ${(2 * unit).toFixed(2)}`),
  cacheRead: asIsoPriceHuman(`USD ${(3 * unit).toFixed(2)}`),
  output: asIsoPriceHuman(`USD ${(4 * unit).toFixed(2)}`),
  total: asIsoPriceHuman(`USD ${(10 * unit).toFixed(2)}`),
});

describe('getOneReviewCostsSummed', () => {
  given('[case1] two realized costs', () => {
    const summed = getOneReviewCostsSummed({
      costs: [asCostOfUnit(1), asCostOfUnit(2)],
    });

    when('[t0] they are summed', () => {
      then('each of the five lines sums on its own', () => {
        expect(summed).toEqual(asCostOfUnit(3));
      });
    });
  });

  given('[case2] no costs at all', () => {
    const summed = getOneReviewCostsSummed({ costs: [] });

    when('[t0] they are summed', () => {
      then('every line reads a nil price, never a throw', () => {
        expect(summed.total).toEqual(asIsoPriceHuman('USD 0'));
        expect(summed.cacheRead).toEqual(asIsoPriceHuman('USD 0'));
      });
    });
  });
});
