import { UnexpectedCodePathError } from 'helpful-errors';

import type { TokenHeld } from '@src/domain.objects/Reflector/TokenHeld';
import type { TranscriptCall } from '@src/domain.objects/Reflector/TranscriptCall';

import type { TokenCountsByKind } from './asTokenPrice';

/**
 * .what = what one held block cost, summed over every call it stayed in context
 * .why = a block read once at call 12 of a 1,000-call session is paid ~988 times; the
 *        inventory shows its size, and `repaid` shows the sum of every time it was paid
 */
export interface TokenRepaidRow {
  held: TokenHeld;

  /**
   * the token-kind counts this block was paid at, across every call it sat in
   */
  tokens: TokenCountsByKind;

  /**
   * how many calls carried this block
   */
  calls: number;
}

/**
 * .what = each held block's cost, split per call by the prompt span it sat in
 * .why = the provider caches by prefix, so each call's prompt is three spans in order:
 *        cache read (the front), cache write (the next stretch), raw input (the tail),
 *        sized by that call's usage. a block's offset in the prompt decides its span —
 *        and an expired cache shows as the block back in the write span, priced as a write
 *
 * .note = blocks sit in the prompt in arrival order; the held list is in that order
 * .note = deliberate mutation: per-row accumulators are local; output rows are fresh objects
 */
export const getOneTokenRepaid = (input: {
  calls: TranscriptCall[];
  held: TokenHeld[];
}): TokenRepaidRow[] => {
  const calls = input.calls.filter((call) => call.isMainThread);

  // the walk below breaks at the first block not yet arrived; out of order, it would
  // silently drop every later block, so the order is asserted rather than assumed
  const outOfOrder = input.held.findIndex(
    (held, index) =>
      index > 0 && held.arrivedAt < input.held[index - 1]!.arrivedAt,
  );
  if (outOfOrder !== -1)
    throw new UnexpectedCodePathError('held blocks are out of arrival order', {
      index: outOfOrder,
      arrivedAt: input.held[outOfOrder]!.arrivedAt,
      arrivedAtPrior: input.held[outOfOrder - 1]!.arrivedAt,
    });

  const rows = input.held.map((held) => ({
    held,
    tokens: {
      input: 0,
      output: 0,
      cacheRead: 0,
      cacheWrite5m: 0,
      cacheWrite1h: 0,
    },
    calls: 0,
  }));

  // a cursor past the ended prefix; a compaction ends every block before it, so the
  // ended rows gather at the front and each call need not re-walk them
  let heldFrom = 0;
  for (let index = 0; index < calls.length; index++) {
    const { spend } = calls[index]!;
    while (
      heldFrom < rows.length &&
      rows[heldFrom]!.held.endedAt !== null &&
      rows[heldFrom]!.held.endedAt! <= index
    )
      heldFrom += 1;
    const readEnd = spend.cacheRead;
    const writeEnd = readEnd + spend.cacheWrite.total;

    // the write span splits by ttl in the ratio this call reports; no split reads as 5m
    const shareOf1h =
      spend.cacheWrite.total > 0 && spend.cacheWrite.ttl1h !== null
        ? spend.cacheWrite.ttl1h / spend.cacheWrite.total
        : 0;

    // walk the blocks in context at this call, in prompt order; arrival order means the
    // first block not yet arrived ends the walk
    let offset = 0;
    for (let rowIndex = heldFrom; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex]!;
      const { held } = row;
      if (held.arrivedAt > index) break;
      if (held.endedAt !== null && held.endedAt <= index) continue;
      const start = offset;
      const end = offset + held.tokens;
      offset = end;

      // overlap with each span
      const read = asOverlap({ start, end, spanStart: 0, spanEnd: readEnd });
      const write = asOverlap({
        start,
        end,
        spanStart: readEnd,
        spanEnd: writeEnd,
      });
      const raw = held.tokens - read - write;
      row.tokens.cacheRead += read;
      row.tokens.cacheWrite1h += write * shareOf1h;
      row.tokens.cacheWrite5m += write * (1 - shareOf1h);
      row.tokens.input += raw;
      row.calls += 1;
    }
  }

  return rows.map((row) => ({
    held: row.held,
    tokens: {
      input: Math.round(row.tokens.input),
      output: 0,
      cacheRead: Math.round(row.tokens.cacheRead),
      cacheWrite5m: Math.round(row.tokens.cacheWrite5m),
      cacheWrite1h: Math.round(row.tokens.cacheWrite1h),
    },
    calls: row.calls,
  }));
};

/**
 * .what = the length of overlap between a block's range and a span
 * .why = a block may straddle a span boundary; each part takes its own span's rate
 */
const asOverlap = (input: {
  start: number;
  end: number;
  spanStart: number;
  spanEnd: number;
}): number =>
  Math.max(
    0,
    Math.min(input.end, input.spanEnd) - Math.max(input.start, input.spanStart),
  );
