import { getError } from 'helpful-errors';
import { given, then, useThen, when } from 'test-fns';

import {
  ENV_OF_REVIEW_BRAIN_CALL_TIMEOUT_MS,
  getOneReviewBrainCallTimeoutMsFromEnv,
} from './getOneReviewBrainCallTimeoutMsFromEnv';
import { ReviewTimeoutError } from './ReviewTimeoutError';
import { withDeadline } from './withDeadline';

describe('stepReview.timeout', () => {
  given('[config] getOneReviewBrainCallTimeoutMsFromEnv', () => {
    then('should be 21 minutes by default', () => {
      expect(getOneReviewBrainCallTimeoutMsFromEnv()).toEqual(21 * 60 * 1000);
    });
  });

  given('[config] the wrapper channel and the human knob are two vars', () => {
    // set an env pair for one read, then restore what was there before
    const withEnv = <T>(env: Record<string, string>, read: () => T): T => {
      const prior = Object.fromEntries(
        Object.keys(env).map((key) => [key, process.env[key]]),
      );
      Object.assign(process.env, env);
      try {
        return read();
      } finally {
        Object.entries(prior).forEach(([key, value]) => {
          if (value === undefined) delete process.env[key];
          if (value !== undefined) process.env[key] = value;
        });
      }
    };

    when('[t0] only the human knob is set', () => {
      then('the human value binds the brain call', () => {
        const ms = withEnv({ RHACHET_REVIEW_TIMEOUT_MS: '5000' }, () =>
          getOneReviewBrainCallTimeoutMsFromEnv(),
        );
        expect(ms).toEqual(5000);
      });
    });

    when(
      '[t1] a wrapper handed down a derived bound beside the human knob',
      () => {
        then(
          'the derived bound wins, and the human knob is left as set',
          () => {
            const read = withEnv(
              {
                RHACHET_REVIEW_TIMEOUT_MS: '5000',
                [ENV_OF_REVIEW_BRAIN_CALL_TIMEOUT_MS]: '4500',
              },
              () => ({
                ms: getOneReviewBrainCallTimeoutMsFromEnv(),
                human: process.env.RHACHET_REVIEW_TIMEOUT_MS,
              }),
            );
            expect(read).toEqual({ ms: 4500, human: '5000' });
          },
        );
      },
    );

    when('[t2] the derived bound is malformed', () => {
      then('it fails loud and names the internal var', () => {
        const error = withEnv(
          { [ENV_OF_REVIEW_BRAIN_CALL_TIMEOUT_MS]: 'abc' },
          () => getError(() => getOneReviewBrainCallTimeoutMsFromEnv()),
        );
        expect(error.message).toContain(ENV_OF_REVIEW_BRAIN_CALL_TIMEOUT_MS);
      });
    });
  });

  given('[case1] operation completes before timeout', () => {
    when('[t0] operation finishes in 10ms with 100ms timeout', () => {
      then('should return the result', async () => {
        const result = await withDeadline({
          operation: async () => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return 'success';
          },
          timeoutMs: 100,
        });
        expect(result).toEqual('success');
      });
    });
  });

  given('[case2] operation exceeds timeout', () => {
    when('[t0] operation takes 200ms with 50ms timeout', () => {
      const fault = useThen('the deadline fires', async () => ({
        error: await getError(
          withDeadline({
            operation: () =>
              new Promise<string>((settle) => setTimeout(settle, 200)),
            timeoutMs: 50,
          }),
        ),
      }));

      then('should throw ReviewTimeoutError', () => {
        expect(fault.error).toBeInstanceOf(ReviewTimeoutError);
      });

      then('error message should indicate malfunction', () => {
        expect(fault.error.message).toContain('💥 MalfunctionError:');
        expect(fault.error.message).toContain('timed out');
      });

      then('the header opens the message exactly once', () => {
        // helpful-errors writes the header itself; a second, hand-written header
        // once printed as `ReviewTimeoutError: 💥 MalfunctionError: …`
        expect(fault.error.message.split('\n')[0]).toEqual(
          '💥 MalfunctionError: review timed out after 50ms',
        );
        expect(fault.error.name).toEqual('ReviewTimeoutError');
      });
    });
  });

  given(
    '[case2.1] a deadline that is the residual share of a larger bound',
    () => {
      when('[t0] the residual 50ms runs out, of a 90ms bound', () => {
        then(
          'the error names the whole bound, never the residual',
          async () => {
            const error = await getError(
              withDeadline(
                {
                  operation: () =>
                    new Promise<string>((settle) => setTimeout(settle, 200)),
                  timeoutMs: 50,
                },
                { msOfBound: 90 },
              ),
            );
            expect(error).toBeInstanceOf(ReviewTimeoutError);
            expect(error.message.split('\n')[0]).toEqual(
              '💥 MalfunctionError: review timed out after 90ms',
            );
          },
        );
      });
    },
  );

  given('[case2.2] an operation still in flight at the deadline', () => {
    when('[t0] the deadline fires', () => {
      then(
        'the signal it handed the operation is aborted, so no new work starts',
        async () => {
          const seen: AbortSignal[] = [];
          const error = await getError(
            withDeadline({
              operation: ({ signal }) => {
                seen.push(signal);
                return new Promise<string>((settle) => setTimeout(settle, 200));
              },
              timeoutMs: 50,
            }),
          );
          expect(error).toBeInstanceOf(ReviewTimeoutError);
          expect(seen[0]?.aborted).toEqual(true);
        },
      );
    });
  });

  given('[case3] operation throws before timeout', () => {
    when('[t0] operation fails immediately', () => {
      then('should propagate the original error', async () => {
        const error = await getError(
          withDeadline({
            operation: async () => {
              throw new Error('original failure');
            },
            timeoutMs: 1000,
          }),
        );
        expect(error.message).toEqual('original failure');
        expect(error).not.toBeInstanceOf(ReviewTimeoutError);
      });
    });
  });
});
