import { withSimpleMutex } from 'with-simple-mutex';

import { getOneReviewWatermarkCache } from './getOneReviewWatermarkCache';

/**
 * .what = run one watermark's read-check-write while a short hold on its key is held
 * .why = two processes that read a watermark, decide, and write it back would otherwise
 *        both see the old value and both act. the hold spans the transition only — a
 *        read and a write of one small json entry — never the work the watermark
 *        describes (rule.require.locks-via-with-simple-mutex)
 *
 * .note = lease 30s: the critical section is two local disk ops (worst case well under a
 *         second, plus the cache's own ~5s per-key file lock), so a 30s lease outlasts it
 *         many times over and a crashed holder frees the key within half a minute
 * .note = acquire 10s at 25ms: contention is a handful of lanes on one machine; ten
 *         seconds of retries outlasts any honest queue, and a timeout surfaces as a
 *         typed `SimpleMutexAcquireTimeoutError` the caller classes as a fault
 */
export const withReviewWatermarkHold = async <T>(
  input: { cwd: string; key: string },
  logic: () => Promise<T>,
): Promise<T> => {
  const held = withSimpleMutex(async (_: { key: string }) => logic(), {
    key: (holdOf) => holdOf.key,
    cache: getOneReviewWatermarkCache({ cwd: input.cwd }),
    lease: { duration: { seconds: 30 } },
    acquire: {
      timeout: { seconds: 10 },
      interval: { milliseconds: 25 },
    },
  });
  return held({ key: `hold.${input.key}` });
};
