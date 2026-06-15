import { getError } from 'helpful-errors';
import { given, then, when } from 'test-fns';

import { ReviewTimeoutError, REVIEW_TIMEOUT_MS } from './stepReview';

/**
 * .what = helper to test timeout behavior with configurable delay
 * .why = enables fast tests without 21min wait
 */
const withTimeoutTest = async <T>(input: {
  operation: () => Promise<T>;
  timeoutMs: number;
}): Promise<T> => {
  let timeoutId: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new ReviewTimeoutError(input.timeoutMs));
    }, input.timeoutMs);
  });

  try {
    const result = await Promise.race([input.operation(), timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

describe('stepReview.timeout', () => {
  given('[config] REVIEW_TIMEOUT_MS', () => {
    then('should be 21 minutes', () => {
      expect(REVIEW_TIMEOUT_MS).toEqual(21 * 60 * 1000);
    });
  });

  given('[case1] operation completes before timeout', () => {
    when('[t0] operation finishes in 10ms with 100ms timeout', () => {
      then('should return the result', async () => {
        const result = await withTimeoutTest({
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
      then('should throw ReviewTimeoutError', async () => {
        const error = await getError(
          withTimeoutTest({
            operation: async () => {
              await new Promise((resolve) => setTimeout(resolve, 200));
              return 'should not reach';
            },
            timeoutMs: 50,
          }),
        );
        expect(error).toBeInstanceOf(ReviewTimeoutError);
      });

      then('error message should indicate malfunction', async () => {
        const error = await getError(
          withTimeoutTest({
            operation: async () => {
              await new Promise((resolve) => setTimeout(resolve, 200));
              return 'should not reach';
            },
            timeoutMs: 50,
          }),
        );
        expect(error.message).toContain('💥 malfunction');
        expect(error.message).toContain('timed out');
      });
    });
  });

  given('[case3] operation throws before timeout', () => {
    when('[t0] operation fails immediately', () => {
      then('should propagate the original error', async () => {
        const error = await getError(
          withTimeoutTest({
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
