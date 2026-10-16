import { asIsoPrice } from 'iso-price';
import { given, then, when } from 'test-fns';

import type { ReviewRunFigures } from '@src/domain.objects/Reviewer/ReviewRunMeter';

/**
 * .what = the clamp that the graded figures are keyed on the grade at compile time
 * .why = a `metered` row with no cost would fold into a sum as a silent `$0`. the
 *        type refuses that row, and this suite fails to COMPILE the day it stops to
 *        (each `@ts-expect-error` turns into an error once its line type-checks)
 */
describe('ReviewRunFigures', () => {
  given('[case1] the figures of a run', () => {
    when('[t0] a metered row carries measured tokens and cost', () => {
      then('it compiles', () => {
        const figures: ReviewRunFigures = {
          grade: 'metered',
          tokens: { input: 1, cacheSet: 0, cacheGet: 0, output: 1 },
          cost: { total: asIsoPrice('USD 0.01'), cacheSaved: null },
        };
        expect(figures.grade).toEqual('metered');
      });
    });

    when('[t1] 🔴 a metered row carries no cost', () => {
      then('it does not compile', () => {
        // .note = a union mismatch reports at the declaration, so the directive sits here
        // @ts-expect-error a metered row must carry a measured cost
        const figures: ReviewRunFigures = {
          grade: 'metered',
          tokens: { input: 1, cacheSet: 0, cacheGet: 0, output: 1 },
          cost: null,
        };
        expect(figures.cost).toBeNull();
      });
    });

    when('[t2] 🔴 an unknown row carries a cost', () => {
      then('it does not compile', () => {
        // @ts-expect-error an unknown row's spend is unrecorded, never a figure
        const figures: ReviewRunFigures = {
          grade: 'unknown',
          tokens: null,
          cost: { total: asIsoPrice('USD 0'), cacheSaved: null },
        };
        expect(figures.grade).toEqual('unknown');
      });
    });
  });
});
