import { asErrorHeadline } from '@src/domain.operations/review/asErrorHeadline';

import { isErrorOfWatermarkFault } from './isErrorOfWatermarkFault';

/**
 * .what = turns a watermark fault into a value its caller records, and rethrows all else
 * .why = a watermark is an optimization, never a gate: a store that refuses a read or a
 *        write must cost the cache, never the review. the allowlist has ONE home, so no
 *        two callers can drift on what a store fault is. a defect
 *        in our own code still surfaces as itself (rule.forbid.failhide)
 *
 * .note = a single value, so it rides `.catch(asWatermarkFaultOrThrow)` by reference
 */
export const asWatermarkFaultOrThrow = (error: unknown): { fault: string } => {
  if (!isErrorOfWatermarkFault({ error })) throw error;
  return { fault: asErrorHeadline({ error }) };
};
