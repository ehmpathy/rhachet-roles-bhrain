import type { TranscriptCallSpend } from '@src/domain.objects/Reflector/TranscriptCall';

/**
 * .what = the context size one call's prompt held
 * .why = the three usage fields are disjoint parts of one prompt; their sum is the context
 */
export const asCallContext = (input: {
  call: { spend: TranscriptCallSpend };
}): number =>
  input.call.spend.inputRaw +
  input.call.spend.cacheRead +
  input.call.spend.cacheWrite.total;
