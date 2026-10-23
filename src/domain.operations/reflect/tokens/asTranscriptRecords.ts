import { genTranscriptLineFold } from './genTranscriptLineFold';
import type { TranscriptRecord } from './isTranscriptRecord';

/**
 * .what = parses jsonl transcript text into records
 * .why = the pure form of `genTranscriptLineFold`, for text already in memory
 */
export const asTranscriptRecords = (input: {
  text: string;
  path: string;
}): { records: TranscriptRecord[]; partialLinesSkipped: number } => {
  const fold = genTranscriptLineFold({ path: input.path });
  const records = input.text
    .split('\n')
    .map((line) => fold.push({ line }))
    .filter((record): record is TranscriptRecord => record !== null);
  return { records, partialLinesSkipped: fold.done().partialLinesSkipped };
};
