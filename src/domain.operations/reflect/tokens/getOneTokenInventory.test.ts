import { given, then, useThen, when } from 'test-fns';

import { TokenBlock } from '@src/domain.objects/Reflector/TokenBlock';
import { TokenHeld } from '@src/domain.objects/Reflector/TokenHeld';
import { TranscriptCall } from '@src/domain.objects/Reflector/TranscriptCall';

import { asCallContext } from './asCallContext';
import { getOneTokenInventory } from './getOneTokenInventory';
import { getOneTokenRepaid } from './getOneTokenRepaid';

/**
 * .what = a main-thread call with a given prompt split and the blocks that arrived before it
 */
const genCall = (input: {
  ordinal: number;
  cacheRead: number;
  cacheWrite: number;
  inputRaw: number;
  output: number;
  arrivals: TokenBlock[];
  isAfterCompaction?: boolean;
}): TranscriptCall =>
  new TranscriptCall({
    ordinal: input.ordinal,
    requestId: `req_${input.ordinal}`,
    model: 'claude-opus-4-5',
    isMainThread: true,
    spend: {
      inputRaw: input.inputRaw,
      cacheRead: input.cacheRead,
      cacheWrite: {
        total: input.cacheWrite,
        ttl5m: input.cacheWrite,
        ttl1h: 0,
      },
      output: input.output,
    },
    arrivals: input.arrivals,
    isAfterCompaction: input.isAfterCompaction ?? false,
  });

const block = (
  category: TokenBlock['category'],
  label: string,
  bytes: number,
): TokenBlock => new TokenBlock({ category, label, bytes });

/**
 * .what = the sum of the tokens held at the last call
 */
const sumHeldAtEnd = (
  held: { tokens: number; endedAt: number | null }[],
): number =>
  held
    .filter((entry) => entry.endedAt === null)
    .reduce((sum, entry) => sum + entry.tokens, 0);

describe('getOneTokenInventory', () => {
  given('[case1] a session that grows by one category per call', () => {
    // call 1: base 10,000 (boot 20,000 bytes + harness)
    // call 2: +100 own output, +2,000 one tool result → exact
    // call 3: +50 own output, +1,000 split across a hook and a tool → apportioned
    const calls = [
      genCall({
        ordinal: 1,
        cacheRead: 0,
        cacheWrite: 9_990,
        inputRaw: 10,
        output: 100,
        arrivals: [block('boot.instructions', 'boot.md', 20_000)],
      }),
      genCall({
        ordinal: 2,
        cacheRead: 10_000,
        cacheWrite: 2_097,
        inputRaw: 3,
        output: 50,
        arrivals: [block('tool.result', 'Read', 8_000)],
      }),
      genCall({
        ordinal: 3,
        cacheRead: 12_100,
        cacheWrite: 1_048,
        inputRaw: 2,
        output: 10,
        arrivals: [
          block('hook.output', 'PreToolUse', 1_000),
          block('tool.result', 'Bash · cat', 3_000),
        ],
      }),
    ];

    when('[t0] the inventory is computed', () => {
      const result = useThen('it succeeds', () =>
        getOneTokenInventory({ calls }),
      );

      then('the blocks held at the last call sum to its context', () => {
        expect(sumHeldAtEnd(result.held)).toEqual(
          asCallContext({ call: calls[2]! }),
        );
      });

      then('the prior call output is measured as assistant.own', () => {
        const own = result.held.filter(
          (entry) => entry.category === 'assistant.own',
        );
        expect(own.map((entry) => entry.tokens)).toEqual([100, 50]);
        expect(own.every((entry) => entry.tier === 'measured')).toBe(true);
      });

      then('a delta with one category arrived is exact', () => {
        const read = result.held.find((entry) => entry.label === 'Read');
        expect(read?.tier).toEqual('exact');
        expect(read?.tokens).toEqual(2_000);
      });

      then('a delta with several categories is apportioned by bytes', () => {
        const hook = result.held.find((entry) => entry.label === 'PreToolUse');
        const cat = result.held.find((entry) => entry.label === 'Bash · cat');
        expect(hook?.tier).toEqual('apportioned');
        expect(cat?.tier).toEqual('apportioned');
        expect(hook!.tokens + cat!.tokens).toEqual(1_000);
        expect(cat!.tokens).toEqual(750);
      });

      then('the base remainder no record explains is unattributed', () => {
        const unattributed = result.held.filter(
          (entry) => entry.category === 'unattributed',
        );
        const boot = result.held.find((entry) => entry.label === 'boot.md');
        expect(
          boot!.tokens + unattributed.reduce((s, e) => s + e.tokens, 0),
        ).toEqual(10_000);
      });
    });

    when('[t1] repaid is computed over the held blocks', () => {
      const result = useThen('it succeeds', () => ({
        rows: getOneTokenRepaid({
          calls,
          held: getOneTokenInventory({ calls }).held,
        }),
      }));

      then('every span of every call is paid by some block', () => {
        const repaid = result.rows;
        const paid = repaid.reduce(
          (sum, row) =>
            sum +
            row.tokens.cacheRead +
            row.tokens.cacheWrite5m +
            row.tokens.cacheWrite1h +
            row.tokens.input,
          0,
        );
        const contexts = calls.reduce(
          (sum, call) => sum + asCallContext({ call }),
          0,
        );
        expect(Math.abs(paid - contexts)).toBeLessThanOrEqual(repaid.length);
      });

      then(
        'a block held from call 1 is paid on each of the three calls',
        () => {
          const boot = result.rows.find((row) => row.held.label === 'boot.md');
          expect(boot?.calls).toEqual(3);
        },
      );

      then('a block first paid as a write is read from cache after', () => {
        // at call 2 the block sits at the prompt tail: the write span ends 3 tokens
        // short of it, so those 3 pay as raw input; at call 3 all 2,000 read from cache
        const read = result.rows.find((row) => row.held.label === 'Read');
        expect(read?.tokens.cacheWrite5m).toEqual(1_997);
        expect(read?.tokens.input).toEqual(3);
        expect(read?.tokens.cacheRead).toEqual(2_000);
      });
    });
  });

  given('[case2] a compaction cuts the context', () => {
    const calls = [
      genCall({
        ordinal: 1,
        cacheRead: 0,
        cacheWrite: 50_000,
        inputRaw: 0,
        output: 10,
        arrivals: [block('boot.instructions', 'boot.md', 100_000)],
      }),
      genCall({
        ordinal: 2,
        cacheRead: 0,
        cacheWrite: 20_000,
        inputRaw: 0,
        output: 10,
        arrivals: [block('system.reminder', 'compaction.summary', 4_000)],
        isAfterCompaction: true,
      }),
    ];

    when('[t0] the inventory is computed', () => {
      const result = useThen('it succeeds', () =>
        getOneTokenInventory({ calls }),
      );

      then('the context re-bases and names the compaction', () => {
        expect(result.rebases).toEqual([
          { ordinal: 2, cause: 'compaction', from: 50_000, to: 20_000 },
        ]);
      });

      then('blocks held before the compaction end there', () => {
        const before = result.held.filter((entry) => entry.arrivedAt === 0);
        expect(before.every((entry) => entry.endedAt === 1)).toBe(true);
      });

      then('the blocks held at the end still sum to the last context', () => {
        expect(sumHeldAtEnd(result.held)).toEqual(20_000);
      });
    });
  });

  given('[case5] the context shrinks with no compaction marker', () => {
    const calls = [
      genCall({
        ordinal: 1,
        cacheRead: 0,
        cacheWrite: 30_000,
        inputRaw: 0,
        output: 10,
        arrivals: [block('boot.instructions', 'boot.md', 60_000)],
      }),
      genCall({
        ordinal: 2,
        cacheRead: 0,
        cacheWrite: 12_000,
        inputRaw: 0,
        output: 10,
        arrivals: [],
      }),
    ];

    when('[t0] the inventory is computed', () => {
      const result = useThen('it succeeds', () =>
        getOneTokenInventory({ calls }),
      );

      then(
        'the drop re-bases as a shrink at its call, never as negative tokens',
        () => {
          expect(result.rebases).toEqual([
            { ordinal: 2, cause: 'shrink', from: 30_000, to: 12_000 },
          ]);
          expect(result.held.every((entry) => entry.tokens >= 0)).toBe(true);
        },
      );

      then('the re-based remainder is named as an unexplained shrink', () => {
        const atEnd = result.held.filter((entry) => entry.endedAt === null);
        expect(atEnd.map((entry) => entry.label)).toContain(
          'context shrink (unexplained)',
        );
      });

      then('the blocks held at the end sum to the shrunk context', () => {
        expect(sumHeldAtEnd(result.held)).toEqual(12_000);
      });
    });
  });

  given('[case3] a base call whose prompt tail is paid as raw input', () => {
    // call 1: context 10,000 = read 9,000 + raw 1,000; boot 4,000 bytes arrived
    // call 2: +2,000 one tool result over 4,000 bytes → calibrates 0.5 tokens per byte
    // so the base holds boot = 2,000 and the harness remainder = 8,000
    const calls = [
      genCall({
        ordinal: 1,
        cacheRead: 9_000,
        cacheWrite: 0,
        inputRaw: 1_000,
        output: 0,
        arrivals: [block('boot.instructions', 'boot.md', 4_000)],
      }),
      genCall({
        ordinal: 2,
        cacheRead: 10_000,
        cacheWrite: 2_000,
        inputRaw: 0,
        output: 0,
        arrivals: [block('tool.result', 'Read', 4_000)],
      }),
    ];

    when('[t0] repaid is computed over the held blocks', () => {
      const result = useThen('it succeeds', () => {
        const { held } = getOneTokenInventory({ calls });
        return { held, rows: getOneTokenRepaid({ calls, held }) };
      });

      then('the harness remainder leads the base, ahead of the boot', () => {
        const base = result.held.filter((entry) => entry.arrivedAt === 0);
        expect(base.map((entry) => entry.category)).toEqual([
          'unattributed',
          'boot.instructions',
        ]);
      });

      then(
        'the boot sits after the harness, so its tail pays raw input',
        () => {
          // the harness fills [0, 8,000); the boot fills [8,000, 10,000). at call 1 the
          // read span ends at 9,000, so the boot reads 1,000 and pays 1,000 raw
          const boot = result.rows.find((row) => row.held.label === 'boot.md');
          expect(boot?.tokens.input).toEqual(1_000);
          expect(boot?.tokens.cacheRead).toEqual(3_000);
        },
      );
    });
  });

  given('[case4] held blocks out of arrival order', () => {
    const calls = [
      genCall({
        ordinal: 1,
        cacheRead: 0,
        cacheWrite: 100,
        inputRaw: 0,
        output: 0,
        arrivals: [],
      }),
    ];

    when('[t0] repaid is computed', () => {
      then('it halts rather than drop the later blocks', () => {
        const { held } = getOneTokenInventory({ calls });
        const reversed = [
          new TokenHeld({ ...held[0]!, arrivedAt: 1 }),
          new TokenHeld({ ...held[0]!, arrivedAt: 0 }),
        ];
        expect(() => getOneTokenRepaid({ calls, held: reversed })).toThrow(
          'held blocks are out of arrival order',
        );
      });
    });
  });
});
