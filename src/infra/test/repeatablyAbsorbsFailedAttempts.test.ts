import { given, then, useBeforeAll, useThen, when } from 'test-fns';

/**
 * .what = clamps the test-fns patch that lets `when.repeatably(SOME)` absorb a failed attempt
 * .why = without the patch, a setup that throws on attempt 1, or an attempt that outlives the
 *        jest timeout, reds the file even when a later attempt passes. live-brain suites hit
 *        both, so one slow or odd brain response blocked a release
 * .note = the patch is `patches/test-fns@1.15.7.patch`; upstream is ehmpathy/test-fns#71
 * .note = a unit test on purpose: the unit env declares no jest.retryTimes, which would mask a red
 */

// declare a budget so the patch can race each attempt against it (jest.setTimeout sets the global)
jest.setTimeout(3000);

const REPEATABLE_CONFIG = { attempts: 3, criteria: 'SOME' } as const;

// count attempts at module scope, so each case can prove a later attempt really ran
const calls = { setup: 0, slow: 0 };

describe('repeatablyAbsorbsFailedAttempts', () => {
  given('[case1] a setup that throws on its first attempt', () => {
    when.repeatably(REPEATABLE_CONFIG)('[t0] the attempts run', () => {
      const scene = useBeforeAll(async () => {
        calls.setup++;
        if (calls.setup === 1)
          throw new Error('first setup fails, as a flaky brain call would');
        return { value: 'second setup succeeds' };
      });

      then('the later attempt reads the setup result', () => {
        expect(scene.value).toEqual('second setup succeeds');
      });
    });

    afterAll(() => {
      // two setups ran: attempt 1 failed, attempt 2 passed, attempt 3 was skipped
      expect(calls.setup).toEqual(2);
    });
  });

  given('[case2] an attempt that outlives the timeout budget', () => {
    when.repeatably(REPEATABLE_CONFIG)('[t0] the attempts run', () => {
      const result = useThen('the operation returns', async () => {
        calls.slow++;
        if (calls.slow === 1)
          await new Promise<void>((done) => {
            setTimeout(done, 10_000).unref();
          });
        return { value: `returned on attempt ${calls.slow}` };
      });

      then('the later attempt reads the operation result', () => {
        expect(result.value).toEqual('returned on attempt 2');
      });
    });

    afterAll(() => {
      // two operations ran: attempt 1 hit the budget, attempt 2 passed
      expect(calls.slow).toEqual(2);
    });
  });
});
