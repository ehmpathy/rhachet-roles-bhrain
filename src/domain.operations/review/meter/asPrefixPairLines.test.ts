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
  sharedChars: 5_000,
  expectedTokens: 1_252,
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
      '   │  ├─ cache.get 626 tok · reach — of expected',
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
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(
        asPrefixPairLines({ identity: thisCase.identity, pair: thisCase.pair }),
      ).toEqual(thisCase.expected);
    }),
  );
});
