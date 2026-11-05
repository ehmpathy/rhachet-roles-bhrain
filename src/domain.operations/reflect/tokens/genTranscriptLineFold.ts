import { UnexpectedCodePathError } from 'helpful-errors';

import {
  isTranscriptRecord,
  type TranscriptRecord,
} from './isTranscriptRecord';

/**
 * .what = a fold that parses one transcript line at a time
 * .why = a transcript may weigh gigabytes, so the reader streams it line by line. a live
 *        transcript's final line may be half-written, which is a tail, not a fault; a torn
 *        line anywhere else is corruption and must fail loud with its line number
 *
 * .note = a torn line is judged only once the next line shows whether it was the last.
 *         `push` returns a record, or null for a blank or a held torn line; `done` throws
 *         if a torn line had any line after it, else counts the tail it skipped
 * .note = deliberate mutation: the line counter and the held torn line are private to the
 *         closure; `done` returns a fresh literal
 */
export const genTranscriptLineFold = (input: {
  path: string;
}): {
  push: (input: { line: string }) => TranscriptRecord | null;
  done: () => { partialLinesSkipped: number };
} => {
  let lineNumber = 0;
  let lastNonEmpty = 0;
  let tornHeld: { lineNumber: number; head: string } | null = null;
  let tornMidFile: { lineNumber: number; head: string } | null = null;

  const push = (pushed: { line: string }): TranscriptRecord | null => {
    lineNumber += 1;
    if (pushed.line.trim() === '') return null;
    lastNonEmpty = lineNumber;

    // a torn line followed by more text was corruption; count on to name the line total
    if (tornHeld !== null) tornMidFile = tornMidFile ?? tornHeld;
    if (tornMidFile !== null) return null;

    // parse the line; a torn one is held until the next line shows whether it was last
    const parsed = asParsedLine({ line: pushed.line });
    tornHeld =
      parsed === null
        ? { lineNumber, head: asLineHead({ line: pushed.line }) }
        : null;
    return parsed;
  };

  const done = (): { partialLinesSkipped: number } => {
    if (tornMidFile !== null)
      throw new UnexpectedCodePathError('malformed transcript line', {
        path: input.path,
        line: `${tornMidFile.lineNumber} of ${lastNonEmpty}`,
        head: tornMidFile.head,
        hint: 'a torn line before the end is corruption, not a live tail; re-copy the file from its source',
      });
    return { partialLinesSkipped: tornHeld === null ? 0 : 1 };
  };

  return { push, done };
};

/**
 * .what = the first characters of a line, marked when cut
 * .why = a human confirms the break by eye; a whole transcript line may hold megabytes
 */
const asLineHead = (input: { line: string }): string =>
  input.line.length <= 80 ? input.line : `${input.line.slice(0, 80)}…`;

/**
 * .what = parses one jsonl line into an object, or null if it is not a json object
 * .why = the caller decides whether a torn line is a tail or corruption
 */
const asParsedLine = (input: { line: string }): TranscriptRecord | null => {
  try {
    const value: unknown = JSON.parse(input.line);
    return isTranscriptRecord(value) ? value : null;
  } catch (error) {
    if (error instanceof SyntaxError) return null;
    throw error;
  }
};
