import { given, then, when } from 'test-fns';

import { MINUTES_OF_CACHE_REACH } from '@src/domain.operations/review/MINUTES_OF_CACHE_REACH';
import { getOnePrefixVerdict } from '@src/domain.operations/review/meter/getOnePrefixVerdict';

/**
 * .what = the tokens of a round, with the axes a case does not name set to zero
 * .why = each case below names only the axes its verdict turns on
 */
const asTokens = (input: { input: number; cacheGet: number }) => ({
  input: input.input,
  cacheSet: 0,
  cacheGet: input.cacheGet,
  output: 10,
});

/**
 * .what = both rounds of a pair on one brain
 * .why = every case that is not about a brain switch holds the brain fixed
 */
const BRAINS_SAME = {
  prior: 'openrouter/deepseek/flash',
  round: 'openrouter/deepseek/flash',
};

/**
 * .what = a gap between two rounds well within the cache reach
 * .why = every case that is not about the clock holds the gap inside the reach
 */
const MINUTES_WITHIN_REACH = 10;

const TEST_CASES = [
  {
    description: 'a shared prefix the cache read half of is served',
    given: {
      sharedChars: 5_000,
      promptChars: 10_000,
      brains: BRAINS_SAME,
      minutesSincePrior: MINUTES_WITHIN_REACH,
      tokens: asTokens({ input: 1_874, cacheGet: 626 }),
    },
    expect: {
      expectedTokens: 1_250,
      detectedTokens: 626,
      reach: 626 / 1_250,
      verdict: 'served',
    },
  },
  {
    description: 'a shared prefix the cache served none of is missed',
    given: {
      sharedChars: 5_000,
      promptChars: 10_000,
      brains: BRAINS_SAME,
      minutesSincePrior: MINUTES_WITHIN_REACH,
      tokens: asTokens({ input: 2_500, cacheGet: 0 }),
    },
    expect: {
      expectedTokens: 1_250,
      detectedTokens: 0,
      reach: 0,
      verdict: 'missed',
    },
  },
  {
    description: 'a run whose read covers its whole prompt is self-cached',
    given: {
      sharedChars: 5_000,
      promptChars: 10_000,
      brains: BRAINS_SAME,
      minutesSincePrior: MINUTES_WITHIN_REACH,
      tokens: asTokens({ input: 1, cacheGet: 2_499 }),
    },
    expect: {
      expectedTokens: 1_250,
      detectedTokens: 2_499,
      reach: null,
      verdict: 'self-cached',
    },
  },
  {
    description: 'a read past the shared prefix is an over-reach',
    given: {
      sharedChars: 2_000,
      promptChars: 10_000,
      brains: BRAINS_SAME,
      minutesSincePrior: MINUTES_WITHIN_REACH,
      tokens: asTokens({ input: 1_500, cacheGet: 1_000 }),
    },
    expect: {
      expectedTokens: 500,
      detectedTokens: 1_000,
      reach: 2,
      verdict: 'over-reach',
    },
  },
  {
    description: 'a read with no shared prefix at all is an over-reach',
    given: {
      sharedChars: 0,
      promptChars: 10_000,
      brains: BRAINS_SAME,
      minutesSincePrior: MINUTES_WITHIN_REACH,
      tokens: asTokens({ input: 2_000, cacheGet: 500 }),
    },
    expect: {
      expectedTokens: 0,
      detectedTokens: 500,
      reach: null,
      verdict: 'over-reach',
    },
  },
  {
    description: 'no shared prefix and no read is unshared',
    given: {
      sharedChars: 0,
      promptChars: 10_000,
      brains: BRAINS_SAME,
      minutesSincePrior: MINUTES_WITHIN_REACH,
      tokens: asTokens({ input: 2_500, cacheGet: 0 }),
    },
    expect: {
      expectedTokens: 0,
      detectedTokens: 0,
      reach: null,
      verdict: 'unshared',
    },
  },
  {
    description:
      'an unmetered round has an expected read at the fallback ratio, and no verdict',
    given: {
      sharedChars: 5_000,
      promptChars: 10_000,
      brains: BRAINS_SAME,
      minutesSincePrior: MINUTES_WITHIN_REACH,
      tokens: null,
    },
    expect: {
      expectedTokens: 1_250,
      detectedTokens: null,
      reach: null,
      verdict: null,
    },
  },
  {
    description: 'a prompt not on disk has no expected read, and no verdict',
    given: {
      sharedChars: null,
      promptChars: 10_000,
      brains: BRAINS_SAME,
      minutesSincePrior: MINUTES_WITHIN_REACH,
      tokens: asTokens({ input: 2_500, cacheGet: 0 }),
    },
    expect: {
      expectedTokens: null,
      detectedTokens: 0,
      reach: null,
      verdict: null,
    },
  },
  {
    description:
      '🔴 a round that switched brains reads unshared, never missed — a cache is per model',
    given: {
      sharedChars: 5_000,
      promptChars: 10_000,
      brains: {
        prior: 'openrouter/deepseek/flash',
        round: 'openrouter/qwen/coder',
      },
      minutesSincePrior: MINUTES_WITHIN_REACH,
      tokens: asTokens({ input: 2_500, cacheGet: 0 }),
    },
    expect: {
      expectedTokens: 0,
      detectedTokens: 0,
      reach: null,
      verdict: 'unshared',
    },
  },
  {
    description:
      'a round that switched brains yet read the cache is an over-reach — its prior wrote naught it could read',
    given: {
      sharedChars: 5_000,
      promptChars: 10_000,
      brains: {
        prior: 'openrouter/deepseek/flash',
        round: 'openrouter/qwen/coder',
      },
      minutesSincePrior: MINUTES_WITHIN_REACH,
      tokens: asTokens({ input: 1_874, cacheGet: 626 }),
    },
    expect: {
      expectedTokens: 0,
      detectedTokens: 626,
      reach: null,
      verdict: 'over-reach',
    },
  },
  {
    description:
      'an unrecorded brain on one side proves no switch, so the pair grades on its bytes',
    given: {
      sharedChars: 5_000,
      promptChars: 10_000,
      brains: { prior: null, round: 'openrouter/qwen/coder' },
      minutesSincePrior: MINUTES_WITHIN_REACH,
      tokens: asTokens({ input: 2_500, cacheGet: 0 }),
    },
    expect: {
      expectedTokens: 1_250,
      detectedTokens: 0,
      reach: 0,
      verdict: 'missed',
    },
  },
  {
    description:
      '🔴 a zero read on a round past the cache reach of its prior is lapsed, never missed',
    given: {
      sharedChars: 5_000,
      promptChars: 10_000,
      brains: BRAINS_SAME,
      minutesSincePrior: MINUTES_OF_CACHE_REACH + 1,
      tokens: asTokens({ input: 2_500, cacheGet: 0 }),
    },
    expect: {
      expectedTokens: 1_250,
      detectedTokens: 0,
      reach: 0,
      verdict: 'lapsed',
    },
  },
  {
    description:
      '🔴 a zero read at the reach exactly is lapsed — the lane ordinal resets at the same boundary',
    given: {
      sharedChars: 5_000,
      promptChars: 10_000,
      brains: BRAINS_SAME,
      minutesSincePrior: MINUTES_OF_CACHE_REACH,
      tokens: asTokens({ input: 2_500, cacheGet: 0 }),
    },
    expect: {
      expectedTokens: 1_250,
      detectedTokens: 0,
      reach: 0,
      verdict: 'lapsed',
    },
  },
  {
    description: 'a zero read one minute inside the reach is a miss',
    given: {
      sharedChars: 5_000,
      promptChars: 10_000,
      brains: BRAINS_SAME,
      minutesSincePrior: MINUTES_OF_CACHE_REACH - 1,
      tokens: asTokens({ input: 2_500, cacheGet: 0 }),
    },
    expect: {
      expectedTokens: 1_250,
      detectedTokens: 0,
      reach: 0,
      verdict: 'missed',
    },
  },
  {
    description:
      'a read past the cache reach is still served — the cache held longer, which is a fact',
    given: {
      sharedChars: 5_000,
      promptChars: 10_000,
      brains: BRAINS_SAME,
      minutesSincePrior: MINUTES_OF_CACHE_REACH + 60,
      tokens: asTokens({ input: 1_874, cacheGet: 626 }),
    },
    expect: {
      expectedTokens: 1_250,
      detectedTokens: 626,
      reach: 626 / 1_250,
      verdict: 'served',
    },
  },
  {
    description: 'an unread gap proves no lapse, so a zero read stays a miss',
    given: {
      sharedChars: 5_000,
      promptChars: 10_000,
      brains: BRAINS_SAME,
      minutesSincePrior: null,
      tokens: asTokens({ input: 2_500, cacheGet: 0 }),
    },
    expect: {
      expectedTokens: 1_250,
      detectedTokens: 0,
      reach: 0,
      verdict: 'missed',
    },
  },
];

/**
 * .what = rounds that met a peer which warmed their head this round — the cure's own win
 * .why = 🔴 a lane reads the head a peer's prime wrote seconds before. graded against its own
 *        prior alone, that read is `over-reach` (it exceeds what the two rounds share) and a
 *        zero read against a stale prior is `lapsed`, so the meter would hide both the win
 *        and its failure
 */
const TEST_CASES_OF_MEET = [
  {
    description:
      '🔴 a read of the head a warm peer wrote is served, never over-reach',
    given: {
      sharedChars: 1_000,
      promptChars: 10_000,
      brains: BRAINS_SAME,
      minutesSincePrior: MINUTES_WITHIN_REACH,
      tokens: asTokens({ input: 300, cacheGet: 2_200 }),
      meet: 'awaited' as const,
      headChars: 9_000,
    },
    expect: {
      expectedTokens: 2_250,
      expectedFrom: 'meet',
      detectedTokens: 2_200,
      reach: 2_200 / 2_250,
      verdict: 'served',
    },
  },
  {
    description:
      '🔴 a zero read after a warm meet is missed, never lapsed — the peer wrote it seconds before',
    given: {
      sharedChars: 1_000,
      promptChars: 10_000,
      brains: BRAINS_SAME,
      minutesSincePrior: MINUTES_OF_CACHE_REACH + 60,
      tokens: asTokens({ input: 2_500, cacheGet: 0 }),
      meet: 'primed' as const,
      headChars: 9_000,
    },
    expect: {
      expectedTokens: 2_250,
      expectedFrom: 'meet',
      detectedTokens: 0,
      reach: 0,
      verdict: 'missed',
    },
  },
  {
    description:
      'a round whose meet poured cold is graded against its prior, as before',
    given: {
      sharedChars: 1_000,
      promptChars: 10_000,
      brains: BRAINS_SAME,
      minutesSincePrior: MINUTES_OF_CACHE_REACH + 60,
      tokens: asTokens({ input: 2_500, cacheGet: 0 }),
      meet: 'solo' as const,
      headChars: 9_000,
    },
    expect: {
      expectedTokens: 250,
      expectedFrom: 'prior',
      detectedTokens: 0,
      reach: 0,
      verdict: 'lapsed',
    },
  },
];

describe('getOnePrefixVerdict', () => {
  given('[case-prior] a table of pairs whose round met no peer', () => {
    TEST_CASES.forEach((thisCase, index) => {
      when(`[t${index}] ${thisCase.description}`, () => {
        then('it reads the expected verdict, priced from the prior', () => {
          // no meet, so every measured expectation is taken from the prior round
          expect(
            getOnePrefixVerdict({
              meet: null,
              headChars: null,
              ...thisCase.given,
            }),
          ).toEqual({
            expectedFrom:
              thisCase.expect.expectedTokens === null ? null : 'prior',
            ...thisCase.expect,
          });
        });
      });
    });
  });

  given('[case-meet] a table of pairs whose round met a peer', () => {
    TEST_CASES_OF_MEET.forEach((thisCase, index) => {
      when(`[t${index}] ${thisCase.description}`, () => {
        then('it reads the expected verdict', () => {
          expect(getOnePrefixVerdict(thisCase.given)).toEqual(thisCase.expect);
        });
      });
    });
  });
});
