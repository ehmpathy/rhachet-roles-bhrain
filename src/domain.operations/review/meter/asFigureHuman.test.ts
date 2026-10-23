import { asFigureHuman } from './asFigureHuman';

/**
 * .what = the scale ladder a run and tree report prints its counts on
 * .why = every rung and every boundary, so a figure never renders on the wrong
 *        rung — `1500.0M` for a billion reads as a typo, and a `1000.0k` for a
 *        million reads as one
 */
const TEST_CASES = [
  { description: 'a small count renders whole', of: 999, expect: '999' },
  { description: 'zero renders whole, never scaled', of: 0, expect: '0' },
  { description: 'the thousand boundary is `k`', of: 1_000, expect: '1.0k' },
  {
    description: 'a thousands figure keeps one decimal',
    of: 12_400,
    expect: '12.4k',
  },
  { description: 'the million boundary is `M`', of: 1_000_000, expect: '1.0M' },
  {
    description: 'the wish`s headline figure',
    of: 779_500_000,
    expect: '779.5M',
  },
  {
    description: 'the billion boundary is `B`, never `1000.0M`',
    of: 1_000_000_000,
    expect: '1.0B',
  },
  {
    description: '🔴 a billion-scale figure never renders as `1500.0M`',
    of: 1_500_000_000,
    expect: '1.5B',
  },
];

describe('asFigureHuman', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asFigureHuman({ of: thisCase.of })).toEqual(thisCase.expect);
    }),
  );
});
