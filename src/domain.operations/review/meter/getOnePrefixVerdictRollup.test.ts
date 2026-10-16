import type {
  ReviewPrefixPair,
  ReviewPrefixRollup,
  ReviewPrefixVerdict,
} from '@src/domain.operations/review/meter/ReviewPrefixPair';

import { getOnePrefixVerdictRollup } from './getOnePrefixVerdictRollup';

/**
 * .what = one round pair with a chosen verdict
 * .why = the rollup reads the verdict alone
 */
const asPair = (input: {
  verdict: ReviewPrefixVerdict | null;
}): ReviewPrefixPair => ({
  reviewer: 'repo-rules',
  prior: { dir: '/r/a', stone: '5.1', iteration: 1 },
  round: { dir: '/r/b', stone: '5.1', iteration: 2 },
  sharedChars: 1_000,
  expectedTokens: 250,
  detectedTokens: 100,
  reach: 0.4,
  verdict: input.verdict,
  breaksIn: 'tail',
  headChars: 500,
});

const TEST_CASES: Array<{
  description: string;
  verdicts: Array<ReviewPrefixVerdict | null>;
  expected: ReviewPrefixRollup;
}> = [
  {
    description: 'no pairs roll up to all zeroes',
    verdicts: [],
    expected: {
      pairs: 0,
      served: 0,
      missed: 0,
      selfCached: 0,
      overReach: 0,
      unshared: 0,
      unmeasured: 0,
    },
  },
  {
    description: 'each verdict counts into its own field',
    verdicts: [
      'served',
      'served',
      'missed',
      'self-cached',
      'over-reach',
      'unshared',
    ],
    expected: {
      pairs: 6,
      served: 2,
      missed: 1,
      selfCached: 1,
      overReach: 1,
      unshared: 1,
      unmeasured: 0,
    },
  },
  {
    description: 'a pair with no verdict counts as unmeasured, never dropped',
    verdicts: ['served', null],
    expected: {
      pairs: 2,
      served: 1,
      missed: 0,
      selfCached: 0,
      overReach: 0,
      unshared: 0,
      unmeasured: 1,
    },
  },
];

describe('getOnePrefixVerdictRollup', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const pairs = thisCase.verdicts.map((verdict) => asPair({ verdict }));
      expect(getOnePrefixVerdictRollup({ pairs })).toEqual(thisCase.expected);
    }),
  );
});
