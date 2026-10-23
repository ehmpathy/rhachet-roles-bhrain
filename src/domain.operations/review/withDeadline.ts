import { ReviewTimeoutError } from '@src/domain.operations/review/ReviewTimeoutError';

/**
 * .what = races an operation against a deadline, and throws ReviewTimeoutError past it
 * .why = a hung brain call must fail fast with a clean malfunction, never wait unbounded
 * .note = apart from `withSpinner`, so a caller can bound a call without a display,
 *         and the deadline holds whether or not a spinner draws (raised i041/r027)
 * .note = `msOfBound` names the bound the error reports, where the deadline is the share of
 *         a larger bound left to this call (`getOneReviewBrainCallResidualMs`): the human set
 *         the whole bound, so the error names the whole bound
 * .note = a race ABANDONS the wait; it cannot cancel the work. a call already in flight at the
 *         deadline runs on, unrecorded. so the deadline also aborts the `signal` it hands the
 *         operation, and an operation that would start NEW work (a retry's second ask) checks
 *         it first — the residual is the one call in flight, never a fresh billed one
 */
export const withDeadline = async <T>(
  input: {
    operation: (input: { signal: AbortSignal }) => Promise<T>;
    timeoutMs: number;
  },
  options?: { msOfBound?: number },
): Promise<T> => {
  // the signal the deadline aborts, so the operation can stop to start new work
  const controller = new AbortController();

  // create timeout with cleanup handle
  // .note = deliberate mutation. the handle is born inside the Promise executor
  //         and must be cleared outside it, once the race settles; the executor
  //         cannot return it, so one write crosses that boundary. it never escapes
  //         this function (rule.require.immutable-vars)
  let timeoutId: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      reject(
        new ReviewTimeoutError({
          timeoutMs: options?.msOfBound ?? input.timeoutMs,
        }),
      );
    }, input.timeoutMs);
  });

  // race the operation, and clear the timer however the race settles
  try {
    return await Promise.race([
      input.operation({ signal: controller.signal }),
      timeoutPromise,
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
};
