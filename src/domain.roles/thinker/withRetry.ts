/**
 * .what = wraps a procedure so a thrown Error triggers one more attempt
 * .why = a brain ask can fail once on a transient fault; one retry absorbs it, and the warn line
 *        keeps the first failure visible
 * .note = a non-Error throw is rethrown at once, never retried
 */
export const withRetry =
  <
    TInput,
    TContext extends {
      log: {
        warn: (
          message: string,
          metadata: { error: { message: string; stack: string | undefined } },
        ) => void;
      };
    },
    TOutput,
  >(
    logic: (input: TInput, context: TContext) => Promise<TOutput>,
  ): ((input: TInput, context: TContext) => Promise<TOutput>) =>
  async (input, context) => {
    try {
      return await logic(input, context);
    } catch (error) {
      // only an Error earns a retry
      if (!(error instanceof Error)) throw error;

      // report the first failure, then try once more
      context.log.warn('withRetry.progress: caught an error, will retry', {
        error: { message: error.message, stack: error.stack },
      });
      return await logic(input, context);
    }
  };
