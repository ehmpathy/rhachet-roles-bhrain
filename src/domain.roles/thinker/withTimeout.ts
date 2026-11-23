import { MalfunctionError } from 'helpful-errors';
import { type IsoDuration, toMilliseconds } from 'iso-time';

/**
 * .what = wraps a procedure so it rejects once a threshold passes
 * .why = a brain ask that hangs must fail loud, so a retry or the caller can act
 * .note = the timer is cleared once the race settles, so no handle outlives the call
 */
export const withTimeout =
  <TInput, TContext, TOutput>(
    logic: (input: TInput, context: TContext) => Promise<TOutput>,
    options: { threshold: IsoDuration },
  ): ((input: TInput, context: TContext) => Promise<TOutput>) =>
  async (input, context) => {
    const thresholdMs = toMilliseconds(options.threshold);
    let timer: NodeJS.Timeout | undefined; // .note = deliberate mutation: the handle exists only once the race starts
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () =>
          reject(
            new MalfunctionError(
              'withTimeout: the call ran past its threshold',
              {
                thresholdMs,
              },
            ),
          ),
        thresholdMs,
      );
    });
    try {
      return await Promise.race([logic(input, context), timeout]);
    } finally {
      clearTimeout(timer);
    }
  };
