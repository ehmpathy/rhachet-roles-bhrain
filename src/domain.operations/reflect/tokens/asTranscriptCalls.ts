import type { TranscriptCall } from '@src/domain.objects/Reflector/TranscriptCall';

import {
  genTranscriptCallFold,
  type TranscriptThread,
} from './genTranscriptCallFold';
import type { TranscriptRecord } from './isTranscriptRecord';

/**
 * .what = the metered calls of one transcript, deduped by `requestId`, in order
 * .why = the pure form of `genTranscriptCallFold`, for a record list already in memory
 */
export const asTranscriptCalls = (input: {
  records: TranscriptRecord[];
  thread: TranscriptThread;
  path: string;
}): TranscriptCall[] => {
  const fold = genTranscriptCallFold({
    thread: input.thread,
    path: input.path,
  });
  input.records.forEach((record) => fold.push({ record }));
  return fold.done().calls;
};
