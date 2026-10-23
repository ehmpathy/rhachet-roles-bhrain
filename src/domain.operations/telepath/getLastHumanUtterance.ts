import * as fs from 'fs/promises';
import { HelpfulError } from 'helpful-errors';

import { getFsErrorCode } from '../getFsErrorCode';
import { isHumanTurn } from '../transcript/isHumanTurn';

/**
 * .what = is this entry a message the human TYPED but the harness has not delivered yet?
 * .why = a queued message is the strongest evidence of a present reader there is — they
 *        are at the keyboard right now. it lands as `queue-operation`/`enqueue` the
 *        instant they hit enter, and as a `user` turn only once the turn ends
 *
 * 🟡 read ONLY `enqueue`. `popAll` and `remove` are the harness's own records, and a
 *    `popAll` fires when the queue drains — which is the assistant's act, not a human's
 */
const isQueuedByHuman = (entry: {
  type?: unknown;
  operation?: unknown;
}): boolean =>
  entry.type === 'queue-operation' && entry.operation === 'enqueue';

/**
 * .what = the timestamp of the newest human utterance in a Stop transcript, or null
 * .why = the onStop nudge fires on how long the reader has been away, so this is the one
 *        fact it needs. null means "cannot tell" and the caller must fail toward the
 *        nudge — a reminder that fires when it need not costs a screen; one that never
 *        fires costs the whole feature (rule.forbid.failhide)
 *
 * .note = it scans from the END and stops at the first hit, so the common case reads a
 *         few dozen lines of a transcript that may hold tens of thousands
 */
export const getLastHumanUtterance = async (input: {
  transcriptPath: string;
}): Promise<Date | null> => {
  const raw = await (async (): Promise<string | null> => {
    try {
      return await fs.readFile(input.transcriptPath, 'utf-8');
    } catch (error) {
      // an absent transcript is a normal state (a first turn, a relocated session), so it
      // reads as "cannot tell". a real fault fails loud with the path + code, never an
      // opaque rethrow (rule.require.failloud); getFsErrorCode reads the code by shape
      const code = getFsErrorCode(error);
      if (code === 'ENOENT') return null;
      throw new HelpfulError('failed to read the stop transcript', {
        path: input.transcriptPath,
        code: code ?? null,
        cause: error instanceof Error ? error : undefined,
      });
    }
  })();
  if (raw === null) return null;

  const lines = raw.split('\n');
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i]!.trim();
    if (line === '') continue;

    // a truncated or half-written line is expected at the tail of a live transcript —
    // skip it and keep the scan. it is not a fault, so it must not fail the read
    const entry = ((): Record<string, unknown> | null => {
      try {
        return JSON.parse(line);
      } catch (error) {
        // only a parse fault is the torn tail; aught else is a real defect
        if (error instanceof SyntaxError) return null;
        throw error;
      }
    })();
    if (entry === null) continue;

    if (!isHumanTurn(entry) && !isQueuedByHuman(entry)) continue;

    const stamp = entry.timestamp;
    if (typeof stamp !== 'string') continue;
    const spokeAt = new Date(stamp);
    if (Number.isNaN(spokeAt.getTime())) continue;

    return spokeAt;
  }

  return null;
};
