import { type IsoDuration, sleep } from 'iso-time';

import { isErrorOfTransientBrainFault } from '@src/domain.operations/review/isErrorOfTransientBrainFault';

/**
 * .what = runs a brain call, and asks again after each transient fault, once per delay —
 *         and reports each fault it swallowed
 * .why = a provider 502/504 malfunctioned 8 of 26 lanes in one round, and each cost a full
 *        re-arrive. a transient fault says naught about the prompt, so a second ask is
 *        the cheap cure; any other fault rethrows at once, unchanged
 *
 * .note = it holds no deadline of its own. the caller's `withDeadline` bounds every attempt
 *         together, and hands the `signal` it aborts at the deadline: a retry checks it
 *         before each new ask, so a chain whose wait was abandoned stops to spend — no billed
 *         ask is issued after the lane already timed out
 * .note = 🔴 `onRetry` hears each fault the moment it is swallowed. a socket that closed
 *         mid-stream may close after the provider billed, and that ask reports no figures,
 *         so the caller must weigh it in the run's spend (`asReviewRunMetricsRealizedOfAsks`).
 *         a callback rather than a return, so a fault swallowed by a chain that later throws
 *         (a cutoff the outer retry then cures) still reaches the caller
 */
export const withTransientBrainRetry = async <T>(input: {
  operation: () => Promise<T>;
  delays: IsoDuration[];
  signal: AbortSignal | null;
  onRetry: (event: { error: unknown }) => void;
}): Promise<T> => {
  // first ask
  try {
    return await input.operation();
  } catch (error) {
    // a non-transient fault, or no retry left, rethrows unchanged
    const [delay, ...delaysLeft] = input.delays;
    if (delay === undefined || !isErrorOfTransientBrainFault({ error }))
      throw error;

    // wait, then ask again with one fewer retry — unless the deadline already abandoned
    // the wait, in which case the last fault rethrows and no new ask is billed
    await sleep(delay);
    if (input.signal?.aborted) throw error;

    // the fault is swallowed: report it, then ask again
    input.onRetry({ error });
    return withTransientBrainRetry({
      operation: input.operation,
      delays: delaysLeft,
      signal: input.signal,
      onRetry: input.onRetry,
    });
  }
};
