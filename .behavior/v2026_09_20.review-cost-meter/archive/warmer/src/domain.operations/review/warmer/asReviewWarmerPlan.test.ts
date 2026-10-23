import { getError } from 'helpful-errors';
import { given, then, when } from 'test-fns';

import {
  asReviewWarmerPlan,
  BOUND_OF_WARMER,
  PLAN_OF_WARMER_ON,
} from './asReviewWarmerPlan';

describe('asReviewWarmerPlan', () => {
  given('[case1] no --warmer flag at all', () => {
    when('[t0] the plan is read', () => {
      then('it is null — the warmer is off by default', () => {
        // a default spends on every caller who did not choose; the warmer's measured
        // net is a loss, so it must be asked for (see `asReviewWarmerPlan`)
        expect(asReviewWarmerPlan({ flag: undefined })).toEqual(null);
      });
    });
  });

  given('[case1b] the plan `on` names', () => {
    when('[t0] the plan is read', () => {
      then('it is the measured 12x,15m', () => {
        // 15m sits under the cache ttl; 12 pokes span the observed round gap
        expect(PLAN_OF_WARMER_ON).toEqual({ pokes: 12, everyMinutes: 15 });
      });

      then('its window covers the measured round gap', () => {
        const windowMinutes =
          PLAN_OF_WARMER_ON.pokes * PLAN_OF_WARMER_ON.everyMinutes;
        expect(windowMinutes).toEqual(180);
        expect(windowMinutes).toBeGreaterThan(89); // the shortest gap observed
      });

      then('🔴 it sits within the bound every typed plan must meet', () => {
        // `on` passes the same bounds as `<k>x,<m>m`, so a bump to the constant past
        // the bound would refuse every `--warmer on` — this clamp names why first
        expect(PLAN_OF_WARMER_ON.pokes).toBeLessThanOrEqual(
          BOUND_OF_WARMER.pokesMax,
        );
        expect(PLAN_OF_WARMER_ON.everyMinutes).toBeLessThanOrEqual(
          BOUND_OF_WARMER.everyMinutesMax,
        );
      });
    });
  });

  given('[case2] the driver says off', () => {
    when('[t0] the plan is read', () => {
      then('it is null — no warmer spawns', () => {
        expect(asReviewWarmerPlan({ flag: 'off' })).toEqual(null);
      });

      then('case and whitespace do not change the verdict', () => {
        expect(asReviewWarmerPlan({ flag: '  OFF ' })).toEqual(null);
      });
    });
  });

  given('[case3] the driver says on', () => {
    when('[t0] the plan is read', () => {
      then('it is the `on` plan', () => {
        expect(asReviewWarmerPlan({ flag: 'on' })).toEqual(PLAN_OF_WARMER_ON);
      });
    });
  });

  given('[case3b] the driver types --warmer and names no plan', () => {
    // a bare `--warmer` is byte-identical to a dropped value, and only one of the two
    // meant to spend (rule.forbid.unexpected-defaults)
    when('[t0] the plan is read', () => {
      then('🔴 it REFUSES rather than guesses', () => {
        expect(() => asReviewWarmerPlan({ flag: true })).toThrow(
          '--warmer was given no value',
        );
      });

      then('the refusal names the whole valid set', () => {
        // the clamp that stops a bare "it threw" green. a refusal that does not
        // state the fix is half an error (rule.require.errors-name-the-fix)
        expect(() => asReviewWarmerPlan({ flag: true })).toThrow(
          'off | on | <k>x,<m>m',
        );
      });

      then('a `false` flag refuses identically — one shape, one answer', () => {
        expect(() => asReviewWarmerPlan({ flag: false })).toThrow(
          '--warmer was given no value',
        );
      });
    });
  });

  given('[case4] the driver declares a custom plan', () => {
    when('[t0] it is well formed', () => {
      then('5x,10m yields 5 pokes 10m apart', () => {
        expect(asReviewWarmerPlan({ flag: '5x,10m' })).toEqual({
          pokes: 5,
          everyMinutes: 10,
        });
      });

      then('a single poke is legal — it is a real, if narrow, plan', () => {
        expect(asReviewWarmerPlan({ flag: '1x,1m' })).toEqual({
          pokes: 1,
          everyMinutes: 1,
        });
      });

      then('the bounds themselves are reachable', () => {
        expect(
          asReviewWarmerPlan({
            flag: `${BOUND_OF_WARMER.pokesMax}x,${BOUND_OF_WARMER.everyMinutesMax}m`,
          }),
        ).toEqual({
          pokes: BOUND_OF_WARMER.pokesMax,
          everyMinutes: BOUND_OF_WARMER.everyMinutesMax,
        });
      });
    });
  });

  given('[case5] the driver writes a malformed value', () => {
    when('[t0] the plan is read', () => {
      then('it REFUSES rather than falls back to the default', async () => {
        // the whole point: a silent fallback would spend on a plan the driver
        // did not write and cannot see
        const error = await getError(async () =>
          asReviewWarmerPlan({ flag: '5 pokes every 10 min' }),
        );
        expect(error.message).toContain('not a plan this can read');
      });

      then('the refusal names the valid shapes', async () => {
        const error = await getError(async () =>
          asReviewWarmerPlan({ flag: 'yes please' }),
        );
        expect(error.message).toContain('--warmer off | on | <k>x,<m>m');
      });

      then('a bare number is refused — the unit is not optional', async () => {
        const error = await getError(async () =>
          asReviewWarmerPlan({ flag: '5' }),
        );
        expect(error.message).toContain('not a plan this can read');
      });

      then('the two numbers cannot be split across flags', async () => {
        // `5x` alone has no cadence, and a cadence is what bounds the ttl risk
        const error = await getError(async () =>
          asReviewWarmerPlan({ flag: '5x' }),
        );
        expect(error.message).toContain('not a plan this can read');
      });
    });
  });

  given('[case6] the driver declares a plan past its bounds', () => {
    when('[t0] the poke count is over the cap', () => {
      then('it refuses, and names the bound', async () => {
        const error = await getError(async () =>
          asReviewWarmerPlan({
            flag: `${BOUND_OF_WARMER.pokesMax + 1}x,15m`,
          }),
        );
        expect(error.message).toContain(`bound of ${BOUND_OF_WARMER.pokesMax}`);
      });
    });

    when('[t1] the cadence is wider than the cache ttl', () => {
      then(
        'it refuses, and names WHY a wide cadence buys no coverage',
        async () => {
          // this is the bound that matters, and it is not about spend: a poke
          // past the ttl refreshes naught and bills in full
          const error = await getError(async () =>
            asReviewWarmerPlan({
              flag: `3x,${BOUND_OF_WARMER.everyMinutesMax + 1}m`,
            }),
          );
          expect(error.message).toContain('past the cache ttl');
        },
      );

      then('the 1x,90m trap is refused — one poke, past the ttl', async () => {
        const error = await getError(async () =>
          asReviewWarmerPlan({ flag: '1x,90m' }),
        );
        expect(error.message).toContain('past the cache ttl');
      });
    });

    when('[t2] the plan asks for zero', () => {
      then(
        '0 pokes is refused, and named as `off` said the long way',
        async () => {
          const error = await getError(async () =>
            asReviewWarmerPlan({ flag: '0x,15m' }),
          );
          expect(error.message).toContain('--warmer off said the long way');
        },
      );

      then('a 0m cadence is refused', async () => {
        const error = await getError(async () =>
          asReviewWarmerPlan({ flag: '3x,0m' }),
        );
        expect(error.message).toContain('spend the whole plan at once');
      });
    });
  });
});
