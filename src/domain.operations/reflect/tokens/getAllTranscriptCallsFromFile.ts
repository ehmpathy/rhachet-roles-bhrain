import * as fs from 'fs';
import * as readline from 'readline';

import type { TranscriptCall } from '@src/domain.objects/Reflector/TranscriptCall';

import {
  genTranscriptCallFold,
  type TranscriptThread,
} from './genTranscriptCallFold';
import { genTranscriptLineFold } from './genTranscriptLineFold';

/**
 * .what = one transcript file's metered calls, streamed from disk
 * .why = a corpus may weigh gigabytes, so the file is read one line at a time and folded
 *        straight into calls; neither its text nor its record list is ever held whole
 *
 * .note = a torn mid-file line halts with its line number once the stream ends
 */
export const getAllTranscriptCallsFromFile = async (input: {
  path: string;
  thread: TranscriptThread;
}): Promise<{
  path: string;
  calls: TranscriptCall[];
  partialLinesSkipped: number;
  records: number;
  recordsWithSpend: number;
}> => {
  const lines = genTranscriptLineFold({ path: input.path });
  const calls = genTranscriptCallFold({
    thread: input.thread,
    path: input.path,
  });

  // stream each line through both folds
  const reader = readline.createInterface({
    input: fs.createReadStream(input.path, 'utf8'),
    crlfDelay: Infinity,
  });
  for await (const line of reader) {
    const record = lines.push({ line });
    if (record !== null) calls.push({ record });
  }

  // a torn mid-file line throws here; a torn tail is counted
  const { partialLinesSkipped } = lines.done();
  return { path: input.path, partialLinesSkipped, ...calls.done() };
};
