import { asIsoPrice } from 'iso-price';
import { given, then, when } from 'test-fns';

import {
  type TokenPriceSum,
  TokenSpendReport,
} from '@src/domain.objects/Reflector/TokenSpendReport';

import { formatTokenSpendTree } from './formatTokenSpendTree';

/**
 * .what = a price sum with no rate known, so every figure renders `unpriced`
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
 * .what = a report whose tool.result row spans five tools
 * .why = the multi-tool split is the branch a one-tool fixture never reaches
 */
const genReport = (): TokenSpendReport =>
  new TokenSpendReport({
    transcripts: [{ path: '<transcript>', chosenBy: 'path', subagentOf: null }],
    skipped: [],
    notes: [],
    partialLinesSkipped: 0,
    calls: 4,
    efficiency: {
      inputRaw: 10,
      cacheRead: 1_000,
      cacheWrite5m: 500,
      cacheWrite1h: 0,
      output: 40,
      priced: { ...UNPRICED, unpricedTokens: 1_550 },
      models: ['claude-demo'],
    },
    contextPerCall: { median: 400, peak: 600 },
    inventory: [
      {
        category: 'tool.result',
        tokens: 1_000,
        tiers: ['apportioned'],
        labels: [
          { label: 'Bash · git.repo.test', tokens: 710 },
          { label: 'Read', tokens: 160 },
          { label: 'Grep', tokens: 60 },
          { label: 'Glob', tokens: 40 },
          { label: 'Edit', tokens: 30 },
        ],
        spread: null,
      },
    ],
    repaid: [],
    rebases: [],
    subagents: [],
    tokensPerByte: null,
  });

describe('formatTokenSpendTree', () => {
  given('[case5] a total price with tokens no rate covers', () => {
    when('[t0] the tree is rendered', () => {
      const tree = formatTokenSpendTree({
        report: genReport(),
        proposal: { rankedBy: 'tokens', targets: [] },
      });

      then('the total price names why it is unpriced', () => {
        expect(tree).toContain('total price = unpriced');
        expect(tree).toContain(
          'why  = no rate spec for these tokens in the installed brain packages',
        );
      });

      then('it says the counts still hold and what lifts the gap', () => {
        expect(tree).toContain('held = every token count above is measured');
        expect(tree).toContain('lift = a brain package version whose spec');
      });
    });

    when('[t1] every token is priced', () => {
      const reportBase = genReport();
      const tree = formatTokenSpendTree({
        report: new TokenSpendReport({
          ...reportBase,
          efficiency: {
            ...reportBase.efficiency,
            priced: {
              price: asIsoPrice('USD 0.18'),
              unpricedTokens: 0,
              byKind: {
                input: asIsoPrice('USD 0.00'),
                output: asIsoPrice('USD 0.00'),
                cacheRead: asIsoPrice('USD 0.02'),
                cacheWrite5m: asIsoPrice('USD 0.16'),
                cacheWrite1h: asIsoPrice('USD 0.00'),
              },
            },
          },
        }),
        proposal: { rankedBy: 'tokens', targets: [] },
      });

      then('the total price is one bare leaf, with no why', () => {
        expect(tree).toContain('total price = $0.18');
        expect(tree).not.toContain('why  = no rate spec');
      });
    });
  });

  given('[case1] an inventory row that spans five tools', () => {
    when('[t0] the tree is rendered', () => {
      const tree = formatTokenSpendTree({
        report: genReport(),
        proposal: { rankedBy: 'tokens', targets: [] },
      });

      then('the top three tools show, and the rest sum into one row', () => {
        expect(tree).toContain('Bash · git.repo.test');
        expect(tree).toContain('(2 more)');
        expect(tree).not.toContain('Glob');
      });

      then('the first sub-row share names its whole', () => {
        expect(tree).toContain('71.0% of tool.result');
      });

      then('the render matches the snapshot', () => {
        expect(tree).toMatchSnapshot();
      });
    });
  });

  given('[case2] a corpus of two read, one skipped, with a rebase', () => {
    const report = new TokenSpendReport({
      ...genReport(),
      transcripts: [
        { path: '/p/one.jsonl', chosenBy: 'glob', subagentOf: null },
        { path: '/p/two.jsonl', chosenBy: 'glob', subagentOf: null },
      ],
      skipped: [
        {
          path: '/p/three.jsonl',
          kind: 'unmetered',
          reason: 'transcript holds no metered calls',
          line: null,
        },
      ],
      inventory: [
        {
          ...genReport().inventory[0]!,
          spread: { p10: 0.22, p50: 0.43, p90: 0.61 },
        },
      ],
      rebases: [
        {
          transcript: '/p/two.jsonl',
          call: 12,
          cause: 'compaction',
          from: 900,
          to: 300,
        },
      ],
    });

    when('[t0] the tree is rendered', () => {
      const tree = formatTokenSpendTree({
        report,
        proposal: { rankedBy: 'tokens', targets: [] },
      });

      then('the header counts matched, metered, and skipped files', () => {
        expect(tree).toContain('matched = 3 · metered = 2 · skipped = 1');
      });

      then('each corpus row shows its spread across sessions', () => {
        expect(tree).toContain('(p10 22.0% · p50 43.0% · p90 61.0%)');
      });

      then('each rebase names the transcript it occurred in', () => {
        expect(tree).toContain(
          'call 12 · compaction · 900 → 300 · in two.jsonl',
        );
      });

      then('the render matches the snapshot', () => {
        expect(tree).toMatchSnapshot();
      });
    });
  });

  given('[case7] a glob of two, one read and one skipped', () => {
    const report = new TokenSpendReport({
      ...genReport(),
      transcripts: [
        { path: '/p/one.jsonl', chosenBy: 'glob', subagentOf: null },
      ],
      skipped: [
        {
          path: '/p/two.jsonl',
          kind: 'unmetered',
          reason: 'transcript holds no metered calls',
          line: null,
        },
      ],
    });

    when('[t0] the tree is rendered', () => {
      const tree = formatTokenSpendTree({
        report,
        proposal: { rankedBy: 'tokens', targets: [] },
      });

      then('the plural title lists every matched path under chosen by', () => {
        expect(tree).toContain('chosen by = glob');
        expect(tree).toMatch(
          /chosen by = glob\n.*├─ \/p\/one\.jsonl\n.*└─ \/p\/two\.jsonl \(skipped · unmetered\)/,
        );
      });

      then(
        'the title counts the matched set, so it agrees with matched =',
        () => {
          expect(tree).toContain('transcripts (2)');
          expect(tree).toContain('matched = 2 · metered = 1 · skipped = 1');
          expect(tree).not.toContain('transcripts (1)');
        },
      );

      then('the singular path leaf is absent', () => {
        expect(tree).not.toContain('path = /p/one.jsonl');
      });
    });
  });

  given('[case3] a transcript with two subagents', () => {
    const report = new TokenSpendReport({
      ...genReport(),
      subagents: [
        {
          path: '/p/one/subagents/agent-a.jsonl',
          calls: 3,
          tokens: 1_200,
          priced: { ...UNPRICED, unpricedTokens: 1_200 },
        },
        {
          path: '/p/one/subagents/agent-b.jsonl',
          calls: 1,
          tokens: 400,
          priced: { ...UNPRICED, unpricedTokens: 400 },
        },
      ],
    });

    when('[t0] the tree is rendered', () => {
      const tree = formatTokenSpendTree({
        report,
        proposal: { rankedBy: 'tokens', targets: [] },
      });

      then('the subagents render as peer rows, each with its own spend', () => {
        expect(tree).toContain('subagents (2, their own spend)');
        expect(tree).toContain('/p/one/subagents/agent-a.jsonl');
        expect(tree).toContain('calls = 3');
      });

      then('the render matches the snapshot', () => {
        expect(tree).toMatchSnapshot();
      });
    });
  });

  given('[case6] thirteen subagents, lightest first in the input', () => {
    // agent-1 spent 100 tokens, agent-13 spent 1,300
    const report = new TokenSpendReport({
      ...genReport(),
      subagents: Array.from({ length: 13 }, (_, index) => ({
        path: `/p/one/subagents/agent-${index + 1}.jsonl`,
        calls: 1,
        tokens: (index + 1) * 100,
        priced: { ...UNPRICED, unpricedTokens: (index + 1) * 100 },
      })),
    });

    when('[t0] the tree is rendered', () => {
      const tree = formatTokenSpendTree({
        report,
        proposal: { rankedBy: 'tokens', targets: [] },
      });

      then('the header still counts all thirteen', () => {
        expect(tree).toContain('subagents (13, their own spend)');
      });

      then(
        'the ten heaviest show, and the three lightest are named as a count',
        () => {
          expect(tree).toContain('agent-13.jsonl');
          expect(tree).toContain('agent-4.jsonl');
          expect(tree).not.toContain('agent-3.jsonl');
          expect(tree).not.toContain('agent-1.jsonl');
          expect(tree).toContain('(3 more)');
        },
      );
    });
  });

  given('[case4] twelve repaid rows, more than the section shows', () => {
    // twelve rows of 1,200 down to 100 tokens; the last two hold 300 of 7,800
    const report = new TokenSpendReport({
      ...genReport(),
      repaid: Array.from({ length: 12 }, (_, index) => ({
        category: 'tool.result' as const,
        label: `tool-${index + 1}`,
        tokens: {
          cacheRead: (12 - index) * 100,
          cacheWrite5m: 0,
          cacheWrite1h: 0,
          input: 0,
        },
        priced: { ...UNPRICED, unpricedTokens: (12 - index) * 100 },
        peak: null,
      })),
    });

    when('[t0] the tree is rendered', () => {
      const tree = formatTokenSpendTree({
        report,
        proposal: { rankedBy: 'tokens', targets: [] },
      });

      then('the top ten rows show', () => {
        expect(tree).toContain('tool.result · tool-10');
        expect(tree).not.toContain('tool.result · tool-11');
      });

      then('the rows past ten are named as a count and a share', () => {
        expect(tree).toContain('(2 more, 3.8% together)');
      });

      then('the render matches the snapshot', () => {
        expect(tree).toMatchSnapshot();
      });
    });
  });
});
