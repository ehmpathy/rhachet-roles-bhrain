import { given, then, when } from 'test-fns';

import { getOneCacheHitRate } from '@src/domain.operations/review/getOneCacheHitRate';

describe('getOneCacheHitRate', () => {
  given('[case1] a bucket that sent prompt tokens', () => {
    when('[t0] the rate is asked for', () => {
      then('it divides by input + cacheSet + cacheGet', () => {
        // 400k of a 1M prompt came from cache -> 40.0%
        expect(
          getOneCacheHitRate({
            tokens: { input: 600_000, cacheSet: 0, cacheGet: 400_000 },
          }),
        ).toEqual(0.4);
      });

      then('🔴 `output` cannot reach the denominator', () => {
        // the signature admits three axes, so a caller who holds a full token
        // record has its `output` dropped by the TYPE rather than by the body.
        // this hands it a record that DOES carry `output` — via a variable, since a
        // literal would trip the excess-property check — and pins the arithmetic:
        // were output swept in, the same figures would read 39.9% instead of 40.0%
        const tokensWithOutput = {
          input: 600_000,
          cacheSet: 0,
          cacheGet: 400_000,
          output: 2_000,
        };
        expect(getOneCacheHitRate({ tokens: tokensWithOutput })).toEqual(0.4);
      });

      then(
        'cacheSet counts toward the denominator, never the numerator',
        () => {
          // a set is a WRITE — the prompt was sent at full rate and stored. to count
          // it as a hit would report a cache that served bytes it only recorded
          expect(
            getOneCacheHitRate({
              tokens: { input: 500_000, cacheSet: 100_000, cacheGet: 400_000 },
            }),
          ).toEqual(0.4);
        },
      );
    });
  });

  given('[case2] a bucket that sent NO prompt token', () => {
    when('[t0] the rate is asked for', () => {
      then('🔴 it answers null, never 0', () => {
        // the branch's central law, applied to a rate. `0` states "a cache served
        // none of it" as a measured fact; `null` states that there was naught to
        // serve. a renderer prints those two differently on purpose, and it can
        // only do so if this operation parts them (rule.forbid.failhide)
        expect(
          getOneCacheHitRate({
            tokens: { input: 0, cacheSet: 0, cacheGet: 0 },
          }),
        ).toEqual(null);
      });
    });
  });

  given('[case3] a bucket whose whole prompt came from cache', () => {
    when('[t0] the rate is asked for', () => {
      then('it answers 1', () => {
        expect(
          getOneCacheHitRate({
            tokens: { input: 0, cacheSet: 0, cacheGet: 58_155 },
          }),
        ).toEqual(1);
      });
    });
  });
});
