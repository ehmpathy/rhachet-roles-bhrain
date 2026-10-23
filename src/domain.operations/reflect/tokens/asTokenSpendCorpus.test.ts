import { given, then, when } from 'test-fns';

import {
  type TokenPriceSum,
  type TokenSpendInventoryRow,
  TokenSpendReport,
  type TokenSpendSkip,
} from '@src/domain.objects/Reflector/TokenSpendReport';

import { asTokenSpendCorpus } from './asTokenSpendCorpus';

/**
 * .what = a price sum with no rate known
 */
const UNPRICED: TokenPriceSum = {
  price: null,
  unpricedTokens: 0,
  byKind: {
    input: null,
    output: null,
    cacheRead: null,
    cacheWrite5m: null,
    cacheWrite1h: null,
  },
};

/**
 * .what = one transcript's report, with the inventory rows and repaid row given
 */
const genReport = (input: {
  path: string;
  calls: number;
  cacheRead: number;
  inventory: TokenSpendInventoryRow[];
  repaidCacheRead: number;
  context: { median: number; peak: number };
}): TokenSpendReport =>
  new TokenSpendReport({
    transcripts: [{ path: input.path, chosenBy: 'glob', subagentOf: null }],
    skipped: [],
    notes: ['a shared note'],
    partialLinesSkipped: 0,
    calls: input.calls,
    efficiency: {
      inputRaw: 1,
      cacheRead: input.cacheRead,
      cacheWrite5m: 0,
      cacheWrite1h: 0,
      output: 1,
      priced: UNPRICED,
      models: ['claude-demo'],
    },
    contextPerCall: input.context,
    inventory: input.inventory,
    repaid: [
      {
        category: 'tool.result',
        label: 'Read',
        tokens: {
          cacheRead: input.repaidCacheRead,
          cacheWrite5m: 0,
          cacheWrite1h: 0,
          input: 0,
        },
        priced: UNPRICED,
        peak: { arrivedAtCall: 3, tokens: 100, calls: 2 },
      },
    ],
    rebases: [
      {
        transcript: input.path,
        call: 2,
        cause: 'compaction',
        from: 900,
        to: 300,
      },
    ],
    subagents: [],
    tokensPerByte: null,
  });

const genRow = (input: {
  category: TokenSpendInventoryRow['category'];
  tokens: number;
}): TokenSpendInventoryRow => ({
  category: input.category,
  tokens: input.tokens,
  tiers: ['measured'],
  labels: [{ label: 'Read', tokens: input.tokens }],
  spread: null,
});

describe('asTokenSpendCorpus', () => {
  given('[case1] two transcripts, one with a category the other lacks', () => {
    const one = genReport({
      path: '/p/one.jsonl',
      calls: 4,
      cacheRead: 1_000,
      inventory: [
        genRow({ category: 'tool.result', tokens: 300 }),
        genRow({ category: 'hook.output', tokens: 100 }),
      ],
      repaidCacheRead: 500,
      context: { median: 200, peak: 400 },
    });
    const two = genReport({
      path: '/p/two.jsonl',
      calls: 6,
      cacheRead: 2_000,
      inventory: [genRow({ category: 'tool.result', tokens: 600 })],
      repaidCacheRead: 700,
      context: { median: 300, peak: 900 },
    });

    when('[t0] they are summed', () => {
      const corpus = asTokenSpendCorpus({
        reports: [one, two],
        skipped: [
          {
            path: '/p/three.jsonl',
            kind: 'unmetered',
            reason: 'transcript holds no metered calls',
            line: null,
          },
        ],
      });

      then('the counts and efficiency are the sums', () => {
        expect(corpus.calls).toEqual(10);
        expect(corpus.efficiency.cacheRead).toEqual(3_000);
      });

      then('every transcript and the skipped file are named', () => {
        expect(corpus.transcripts.map((entry) => entry.path)).toEqual([
          '/p/one.jsonl',
          '/p/two.jsonl',
        ]);
        expect(corpus.skipped.map((entry) => entry.path)).toEqual([
          '/p/three.jsonl',
        ]);
      });

      then('a note named by both reads once', () => {
        expect(corpus.notes).toEqual(['a shared note']);
      });

      then('the inventory sums per category, largest first', () => {
        expect(
          corpus.inventory.map((row) => [row.category, row.tokens]),
        ).toEqual([
          ['tool.result', 900],
          ['hook.output', 100],
        ]);
      });

      then(
        'a category one transcript lacks counts a zero share in its spread',
        () => {
          // shares of hook.output: one = 100/400 = 0.25, two = 0
          const hook = corpus.inventory.find(
            (row) => row.category === 'hook.output',
          );
          expect(hook?.spread).toEqual({ p10: 0, p50: 0, p90: 0.25 });
        },
      );

      then('the repaid row sums across sessions and drops its peak', () => {
        expect(corpus.repaid).toHaveLength(1);
        expect(corpus.repaid[0]!.tokens.cacheRead).toEqual(1_200);
        expect(corpus.repaid[0]!.peak).toEqual(null);
      });

      then('each rebase keeps the transcript it occurred in', () => {
        expect(corpus.rebases.map((rebase) => rebase.transcript)).toEqual([
          '/p/one.jsonl',
          '/p/two.jsonl',
        ]);
      });

      then('context per call is the peak of peaks', () => {
        expect(corpus.contextPerCall?.peak).toEqual(900);
      });
    });
  });

  given('[case4] a note only one of two transcripts carries', () => {
    const one = genReport({
      path: '/p/one.jsonl',
      calls: 4,
      cacheRead: 1_000,
      inventory: [genRow({ category: 'tool.result', tokens: 300 })],
      repaidCacheRead: 500,
      context: { median: 200, peak: 400 },
    });
    const two = new TokenSpendReport({
      ...genReport({
        path: '/p/two.jsonl',
        calls: 6,
        cacheRead: 2_000,
        inventory: [genRow({ category: 'boot.instructions', tokens: 600 })],
        repaidCacheRead: 700,
        context: { median: 300, peak: 900 },
      }),
      notes: [],
    });

    when('[t0] they are summed', () => {
      const corpus = asTokenSpendCorpus({ reports: [one, two], skipped: [] });

      then('the note names how many transcripts it holds for', () => {
        expect(corpus.notes).toEqual(['a shared note (in 1 of 2 transcripts)']);
      });
    });
  });

  given('[case2] one transcript and no skip', () => {
    const one = genReport({
      path: '/p/one.jsonl',
      calls: 4,
      cacheRead: 1_000,
      inventory: [genRow({ category: 'tool.result', tokens: 300 })],
      repaidCacheRead: 500,
      context: { median: 200, peak: 400 },
    });

    when('[t0] it is summed', () => {
      then('the report is returned as is, peak and all', () => {
        const corpus = asTokenSpendCorpus({ reports: [one], skipped: [] });
        expect(corpus).toBe(one);
      });
    });
  });

  given('[case3] one metered transcript beside a skipped file', () => {
    const one = genReport({
      path: '/p/one.jsonl',
      calls: 4,
      cacheRead: 1_000,
      inventory: [genRow({ category: 'tool.result', tokens: 300 })],
      repaidCacheRead: 500,
      context: { median: 200, peak: 400 },
    });
    const skip: TokenSpendSkip = {
      path: '/p/torn.jsonl',
      kind: 'malformed',
      reason: 'transcript line is not json',
      line: '2 of 3',
    };

    when('[t0] it is summed', () => {
      const corpus = asTokenSpendCorpus({ reports: [one], skipped: [skip] });

      then('the skipped file is named', () => {
        expect(corpus.skipped).toEqual([skip]);
      });

      then('the repaid rows keep their peak, as one transcript', () => {
        expect(corpus.repaid).toEqual(one.repaid);
      });

      then('the inventory carries no one-session spread', () => {
        expect(corpus.inventory.map((row) => row.spread)).toEqual([null]);
      });
    });
  });
});
