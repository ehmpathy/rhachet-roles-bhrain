import { given, then, when } from 'test-fns';

import { CENSUS_OF_CACHE_REACH } from './CENSUS_OF_CACHE_REACH';
import { MINUTES_OF_CACHE_REACH } from './MINUTES_OF_CACHE_REACH';

/**
 * .what = clamp: every constant the census grounds agrees with the census
 * .why = the figure is declared once, but a constant still rests on it. a later
 *        correction to the census must fail here until that constant is re-weighed
 */
describe('CENSUS_OF_CACHE_REACH', () => {
  given('[case1] the decay arm', () => {
    const decay = CENSUS_OF_CACHE_REACH.decay;
    const reachLast = decay.find((point) => point.hitRate === 0);

    when('[t0] the reach constant is read', () => {
      then('it is the first gap the census measured at a hit rate of 0', () => {
        expect(reachLast?.gapMinutes).toEqual(MINUTES_OF_CACHE_REACH);
      });
    });
  });

  given('[case2] the cross-process arm', () => {
    when('[t0] its rate is read beside the decay arm', () => {
      then(
        'it is stated with its own n, and it is far below the decay rate',
        () => {
          const { hits, of } = CENSUS_OF_CACHE_REACH.crossProcess;
          expect(of).toBeGreaterThan(0);
          expect(hits / of).toBeLessThan(
            CENSUS_OF_CACHE_REACH.decay[0].hitRate,
          );
        },
      );
    });
  });
});
