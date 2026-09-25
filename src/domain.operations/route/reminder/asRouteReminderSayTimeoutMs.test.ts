import { BadRequestError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { asRouteReminderSayTimeoutMs } from './asRouteReminderSayTimeoutMs';
import { DEFAULT_REMINDER_SAY_TIMEOUT_MS } from './DEFAULT_REMINDER_SAY_TIMEOUT_MS';

/**
 * .what = clamps the strict-parse contract of the say-timeout cast
 * .why = the say-timeout knob threads the SAME strict gate as --interval-ms: a lenient parse would
 *        launder a typo (`30000abc` → 30000, `abc` → NaN) into a bogus inject-bound + a false
 *        success. these cases prove the strict gate rejects every malformed form, honors the floor
 *        and the setTimeout cap, and resolves the default only for a truly absent flag.
 */
describe('asRouteReminderSayTimeoutMs', () => {
  given('[case1] an absent flag', () => {
    when('[t0] cast', () => {
      then('it resolves the default timeout', () => {
        expect(asRouteReminderSayTimeoutMs({ raw: undefined })).toBe(
          DEFAULT_REMINDER_SAY_TIMEOUT_MS,
        );
      });
    });
  });

  given('[case2] a clean positive integer', () => {
    when('[t0] cast', () => {
      then('it returns that integer', () => {
        expect(asRouteReminderSayTimeoutMs({ raw: '30000' })).toBe(30000);
      });
    });
  });

  given('[case3] malformed flags the lenient parse would launder', () => {
    const REJECTED = ['abc', '30000abc', '1abc', '30 00', '', '  ', '-5', '0'];
    REJECTED.map((raw) =>
      when(`[t0] cast of ${JSON.stringify(raw)}`, () => {
        then('it throws a constraint error that names the fix', async () => {
          const error = await getError(async () =>
            asRouteReminderSayTimeoutMs({ raw }),
          );
          expect(error).toBeInstanceOf(BadRequestError);
          expect(error.message).toContain(
            '--say-timeout-ms must be a positive integer',
          );
        });
      }),
    );
  });

  // the clamp for the setTimeout-cap failhide: a value above node's max setTimeout delay
  // (2^31-1 ms) does NOT throw in node — it SILENTLY clamps to ~1ms. the cast must reject it LOUD
  // at the parse boundary. RED under a positive-integer-only guard (returns the huge value, which
  // then cancels almost every real inject mid-flight), GREEN under the max-cap bound.
  given('[case4] a value above the setTimeout cap (2^31-1)', () => {
    const OVER_CAP = ['2147483648', '9999999999', '99999999999999'];
    OVER_CAP.map((raw) =>
      when(`[t0] cast of ${JSON.stringify(raw)}`, () => {
        then('it throws a constraint error that names the max', async () => {
          const error = await getError(async () =>
            asRouteReminderSayTimeoutMs({ raw }),
          );
          expect(error).toBeInstanceOf(BadRequestError);
          expect(error.message).toContain('exceeds the max supported bound');
        });
      }),
    );
  });

  given('[case5] the exact max cap value (2^31-1) is accepted', () => {
    when('[t0] cast', () => {
      then('it returns the boundary value, never rejects the edge', () => {
        // the boundary itself is valid — only values STRICTLY above it wrap in node
        expect(asRouteReminderSayTimeoutMs({ raw: '2147483647' })).toBe(
          2147483647,
        );
      });
    });
  });

  // the clamp for a sub-second bound: a value below the floor would cancel almost every real
  // `clone say` mid-flight (the call answers in ms, but a loaded machine takes longer), which
  // defeats the knob's purpose. the cast must reject a below-floor value LOUD.
  given('[case6] a value below the min sane bound (1000 ms)', () => {
    const BELOW_FLOOR = ['1', '2', '500', '999'];
    BELOW_FLOOR.map((raw) =>
      when(`[t0] cast of ${JSON.stringify(raw)}`, () => {
        then('it throws a constraint error that names the min', async () => {
          const error = await getError(async () =>
            asRouteReminderSayTimeoutMs({ raw }),
          );
          expect(error).toBeInstanceOf(BadRequestError);
          expect(error.message).toContain('below the min sane bound');
        });
      }),
    );
  });

  given('[case7] the exact min floor value (1000) is accepted', () => {
    when('[t0] cast', () => {
      then('it returns the boundary value, never rejects the edge', () => {
        // the floor itself is valid — only values STRICTLY below it defeat the knob
        expect(asRouteReminderSayTimeoutMs({ raw: '1000' })).toBe(1000);
      });
    });
  });
});
