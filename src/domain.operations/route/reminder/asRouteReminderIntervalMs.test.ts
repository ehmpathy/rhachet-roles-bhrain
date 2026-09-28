import { BadRequestError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { asRouteReminderIntervalMs } from './asRouteReminderIntervalMs';
import { DEFAULT_REMINDER_INTERVAL_MS } from './DEFAULT_REMINDER_INTERVAL_MS';

/**
 * .what = clamps the strict-parse contract of the interval cast
 * .why = five peer reviewers flagged that a lenient parse launders a typo (`1200000abc` → 1200000,
 *        `abc` → NaN) into a bogus cadence + a false success. these cases prove the strict gate
 *        rejects every malformed form and resolves the default only for a truly absent flag.
 */
describe('asRouteReminderIntervalMs', () => {
  given('[case1] an absent flag', () => {
    when('[t0] cast', () => {
      then('it resolves the default cadence', () => {
        expect(asRouteReminderIntervalMs({ raw: undefined })).toBe(
          DEFAULT_REMINDER_INTERVAL_MS,
        );
      });
    });
  });

  given('[case2] a clean positive integer', () => {
    when('[t0] cast', () => {
      then('it returns that integer', () => {
        expect(asRouteReminderIntervalMs({ raw: '1200000' })).toBe(1200000);
      });
    });
  });

  given('[case3] malformed flags the lenient parse would launder', () => {
    const REJECTED = [
      'abc',
      '1200000abc',
      '1abc',
      '12 34',
      '',
      '  ',
      '-5',
      '0',
    ];
    REJECTED.map((raw) =>
      when(`[t0] cast of ${JSON.stringify(raw)}`, () => {
        then('it throws a constraint error that names the fix', async () => {
          const error = await getError(async () =>
            asRouteReminderIntervalMs({ raw }),
          );
          expect(error).toBeInstanceOf(BadRequestError);
          expect(error.message).toContain(
            '--interval-ms must be a positive integer',
          );
        });
      }),
    );
  });

  // the clamp for the setTimeout-cap failhide: a value above node's max setTimeout delay
  // (2^31-1 ms) does NOT throw in node — it SILENTLY clamps to a 1ms busy-loop. the cast must
  // reject it LOUD at the parse boundary. RED under the old positive-integer-only guard (would
  // return the huge value, which then busy-loops), GREEN under the max-cap bound.
  given('[case4] a value above the setTimeout cap (2^31-1)', () => {
    const OVER_CAP = ['2147483648', '9999999999', '99999999999999'];
    OVER_CAP.map((raw) =>
      when(`[t0] cast of ${JSON.stringify(raw)}`, () => {
        then('it throws a constraint error that names the max', async () => {
          const error = await getError(async () =>
            asRouteReminderIntervalMs({ raw }),
          );
          expect(error).toBeInstanceOf(BadRequestError);
          expect(error.message).toContain('exceeds the max supported cadence');
        });
      }),
    );
  });

  given('[case5] the exact max cap value (2^31-1) is accepted', () => {
    when('[t0] cast', () => {
      then('it returns the boundary value, never rejects the edge', () => {
        // the boundary itself is valid — only values STRICTLY above it wrap in node
        expect(asRouteReminderIntervalMs({ raw: '2147483647' })).toBe(
          2147483647,
        );
      });
    });
  });

  // the clamp for the busy-loop DoS: a sub-second cadence would spawn `rhx clone say` a thousand
  // times a second at the driver's own session. the cast must reject a below-floor value LOUD.
  // RED under the positive-integer-only guard (accepts 1, which busy-loops), GREEN under the floor.
  given('[case6] a value below the min sane cadence (1000 ms)', () => {
    const BELOW_FLOOR = ['1', '2', '500', '999'];
    BELOW_FLOOR.map((raw) =>
      when(`[t0] cast of ${JSON.stringify(raw)}`, () => {
        then('it throws a constraint error that names the min', async () => {
          const error = await getError(async () =>
            asRouteReminderIntervalMs({ raw }),
          );
          expect(error).toBeInstanceOf(BadRequestError);
          expect(error.message).toContain('below the min sane cadence');
        });
      }),
    );
  });

  given('[case7] the exact min floor value (1000) is accepted', () => {
    when('[t0] cast', () => {
      then('it returns the boundary value, never rejects the edge', () => {
        // the floor itself is valid — only values STRICTLY below it are the DoS risk
        expect(asRouteReminderIntervalMs({ raw: '1000' })).toBe(1000);
      });
    });
  });
});
