import { given, then, when } from 'test-fns';

import type { ReviewRunIdentity } from '@src/domain.objects/Reviewer/ReviewRunIdentity';
import type { ReviewPrefixPair } from '@src/domain.operations/review/meter/ReviewPrefixPair';

import { asPrefixPairLines } from './asPrefixPairLines';

const IDENTITY: ReviewRunIdentity = {
  route: '.behavior/v2026_09_20.review-cost-meter',
  stone: '5.1',
  iteration: 2,
  hash: 'a1b2c3d',
  index: 1,
  slug: 'repo-rules',
};

/**
 * .what = a measured pair, with chosen fields overridden
 * .why = each case names only the fields it is about
 */
const asPair = (input: Partial<ReviewPrefixPair>): ReviewPrefixPair => ({
  reviewer: 'repo-rules',
  prior: { dir: '/r/a', stone: '5.1', iteration: 1 },
  round: { dir: '/r/b', stone: '5.1', iteration: 2 },
  brains: { prior: null, round: null },
  minutesSincePrior: 10,
  meet: null,
  sharedChars: 5_000,
  expectedTokens: 1_252,
  expectedFrom: 'prior',
  detectedTokens: 626,
  reach: 0.5,
  verdict: 'served',
  breaksIn: 'tail',
  headChars: 3_000,
  ...input,
});

const TEST_CASES: Array<{
  description: string;
  identity: ReviewRunIdentity | null;
  pair: ReviewPrefixPair | null;
  expected: string[];
}> = [
  {
    description: 'a served pair renders its verdict, both halves, and the part',
    identity: IDENTITY,
    pair: asPair({}),
    expected: [
      '   ├─ prefix vs i1: served',
      '   │  ├─ cache.get 626 tok · reach 50.0% of expected',
      '   │  ├─ expected 1.3k tok est. (5.0k chars shared with i1)',
      '   │  └─ prefix breaks in: tail',
    ],
  },
  {
    description:
      '🔴 an unshared pair whose rounds rode two brains names the switch, never a layout break',
    identity: IDENTITY,
    pair: asPair({
      brains: {
        prior: 'openrouter/deepseek/flash',
        round: 'openrouter/deepseek/pro',
      },
      detectedTokens: 0,
      expectedTokens: 0,
      reach: null,
      verdict: 'unshared',
    }),
    expected: [
      '   ├─ prefix vs i1: unshared — brain switched (openrouter/deepseek/flash → openrouter/deepseek/pro)',
      '   │  ├─ cache.get 0 tok',
      "   │  └─ a cache is per model, so i1's prompt on openrouter/deepseek/flash held no prefix for openrouter/deepseek/pro to read",
    ],
  },
  {
    description:
      'an unshared pair on one brain keeps its shared and break rows — the layout is the suspect',
    identity: IDENTITY,
    pair: asPair({
      brains: {
        prior: 'openrouter/deepseek/flash',
        round: 'openrouter/deepseek/flash',
      },
      sharedChars: 0,
      detectedTokens: 0,
      expectedTokens: 0,
      reach: null,
      verdict: 'unshared',
      breaksIn: 'head',
    }),
    expected: [
      '   ├─ prefix vs i1: unshared',
      '   │  ├─ cache.get 0 tok · reach —  (no expected prefix to weigh it against)',
      '   │  ├─ expected 0 tok est. (0 chars shared with i1)',
      '   │  └─ prefix breaks in: head',
    ],
  },
  {
    description: 'a miss carries 🔴',
    identity: IDENTITY,
    pair: asPair({ detectedTokens: 0, reach: 0, verdict: 'missed' }),
    expected: [
      '   ├─ prefix vs i1: 🔴 missed',
      '   │  ├─ cache.get 0 tok · reach 0.0% of expected',
      '   │  ├─ expected 1.3k tok est. (5.0k chars shared with i1)',
      '   │  └─ prefix breaks in: tail',
    ],
  },
  {
    description:
      'a lapse carries 🟡 and names its gap past the reach, so a zero read reads as the clock',
    identity: IDENTITY,
    pair: asPair({
      detectedTokens: 0,
      reach: 0,
      verdict: 'lapsed',
      minutesSincePrior: 119.6,
    }),
    expected: [
      '   ├─ prefix vs i1: 🟡 lapsed (120m since i1, past the 66-minute reach)',
      '   │  ├─ cache.get 0 tok · reach 0.0% of expected',
      '   │  ├─ expected 1.3k tok est. (5.0k chars shared with i1)',
      '   │  └─ prefix breaks in: tail',
    ],
  },
  {
    description: 'a lapse against a prior on another stone names that stone',
    identity: IDENTITY,
    pair: asPair({
      prior: { dir: '/r/a', stone: '3.1', iteration: 7 },
      detectedTokens: 0,
      reach: 0,
      verdict: 'lapsed',
      minutesSincePrior: 240,
    }),
    expected: [
      '   ├─ prefix vs 3.1 i7: 🟡 lapsed (240m since 3.1 i7, past the 66-minute reach)',
      '   │  ├─ cache.get 0 tok · reach 0.0% of expected',
      '   │  ├─ expected 1.3k tok est. (5.0k chars shared with 3.1 i7)',
      '   │  └─ prefix breaks in: tail',
    ],
  },
  {
    description: 'a miss within the reach names no gap',
    identity: IDENTITY,
    pair: asPair({
      detectedTokens: 0,
      reach: 0,
      verdict: 'missed',
      minutesSincePrior: 12,
    }),
    expected: [
      '   ├─ prefix vs i1: 🔴 missed',
      '   │  ├─ cache.get 0 tok · reach 0.0% of expected',
      '   │  ├─ expected 1.3k tok est. (5.0k chars shared with i1)',
      '   │  └─ prefix breaks in: tail',
    ],
  },
  {
    description: 'an over-reach carries 🟡',
    identity: IDENTITY,
    pair: asPair({ detectedTokens: 2_000, reach: 1.6, verdict: 'over-reach' }),
    expected: [
      '   ├─ prefix vs i1: 🟡 over-reach',
      '   │  ├─ cache.get 2.0k tok · reach 160.0% of expected',
      '   │  ├─ expected 1.3k tok est. (5.0k chars shared with i1)',
      '   │  └─ prefix breaks in: tail',
    ],
  },
  {
    description: 'a prior on another stone is named with its stone',
    identity: IDENTITY,
    pair: asPair({ prior: { dir: '/r/a', stone: '3.1', iteration: 7 } }),
    expected: [
      '   ├─ prefix vs 3.1 i7: served',
      '   │  ├─ cache.get 626 tok · reach 50.0% of expected',
      '   │  ├─ expected 1.3k tok est. (5.0k chars shared with 3.1 i7)',
      '   │  └─ prefix breaks in: tail',
    ],
  },
  {
    description:
      '🔴 a pair whose expected read the meet set names the head and the meet, never the prior',
    identity: IDENTITY,
    pair: asPair({
      meet: 'awaited',
      sharedChars: 1_000,
      headChars: 9_000,
      expectedTokens: 2_250,
      expectedFrom: 'meet',
      detectedTokens: 2_200,
      reach: 2_200 / 2_250,
    }),
    expected: [
      '   ├─ prefix vs i1: served',
      '   │  ├─ cache.get 2.2k tok · reach 97.8% of expected',
      '   │  ├─ expected 2.3k tok est. (9.0k chars of head a peer warmed this round; meet: awaited)',
      '   │  └─ prefix breaks in: tail',
    ],
  },
  {
    description:
      '🔴 a lane that led the meet names its own poke as the warmer, never a peer',
    identity: IDENTITY,
    pair: asPair({
      meet: 'primed',
      sharedChars: 1_000,
      headChars: 9_000,
      expectedTokens: 2_250,
      expectedFrom: 'meet',
      detectedTokens: 2_200,
      reach: 2_200 / 2_250,
    }),
    expected: [
      '   ├─ prefix vs i1: served',
      '   │  ├─ cache.get 2.2k tok · reach 97.8% of expected',
      '   │  ├─ expected 2.3k tok est. (9.0k chars of head its own poke warmed this round; meet: primed)',
      '   │  └─ prefix breaks in: tail',
    ],
  },
  {
    description: 'a pair whose prompt is absent reads absent, with the cause',
    identity: IDENTITY,
    pair: asPair({
      sharedChars: null,
      expectedTokens: null,
      reach: null,
      verdict: null,
      breaksIn: null,
    }),
    expected: [
      '   ├─ prefix vs i1: —  (a prompt is not on disk)',
      '   │  ├─ cache.get 626 tok · reach —  (no expected prefix to weigh it against)',
      '   │  ├─ expected — (— shared with i1)',
      '   │  └─ prefix breaks in: —',
    ],
  },
  {
    description: 'a lane first round reads absent, with its slug',
    identity: IDENTITY,
    pair: null,
    expected: ['   ├─ prefix: —  (the first round of repo-rules in this tree)'],
  },
  {
    description: 'a run with no guard identity reads absent, with the cause',
    identity: null,
    pair: null,
    expected: [
      '   ├─ prefix: —  (no guard identity, so no prior round to pair with)',
    ],
  },
];

describe('asPrefixPairLines', () => {
  given('[case1] a run identity and its prefix pair', () => {
    TEST_CASES.forEach((thisCase, index) =>
      when(`[t${index}] the pair lines are rendered`, () => {
        then(thisCase.description, () => {
          expect(
            asPrefixPairLines({
              identity: thisCase.identity,
              pair: thisCase.pair,
            }),
          ).toEqual(thisCase.expected);
        });
      }),
    );
  });
});
