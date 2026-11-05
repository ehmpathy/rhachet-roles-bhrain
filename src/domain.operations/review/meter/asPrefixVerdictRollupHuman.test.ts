import { given, then, when } from 'test-fns';

import type { ReviewPrefixRollup } from '@src/domain.operations/review/meter/ReviewPrefixPair';

import { asPrefixVerdictRollupHuman } from './asPrefixVerdictRollupHuman';

/**
 * .what = a rollup with chosen counts, the rest zero
 * .why = each case names only the counts it is about
 */
const asRollup = (input: Partial<ReviewPrefixRollup>): ReviewPrefixRollup => ({
  pairs: 0,
  served: 0,
  missed: 0,
  lapsed: 0,
  selfCached: 0,
  overReach: 0,
  unshared: 0,
  unmeasured: 0,
  ...input,
});

const TEST_CASES: Array<{
  description: string;
  rollup: ReviewPrefixRollup;
  absent: string;
  expected: string;
}> = [
  {
    description: 'no pairs read absent, in the page mark, with the reason',
    rollup: asRollup({}),
    absent: '—',
    expected: '—  (no reviewer ran twice)',
  },
  {
    description: 'the grove word stands in for the mark on its page',
    rollup: asRollup({}),
    absent: 'absent',
    expected: 'absent  (no reviewer ran twice)',
  },
  {
    description: 'zero counts carry no glyph',
    rollup: asRollup({ pairs: 1, served: 1 }),
    absent: '—',
    expected:
      '1 served · 0 missed · 0 lapsed · 0 self-cached · 0 over-reach · 0 unshared',
  },
  {
    description:
      'a nonzero miss carries 🔴 and a nonzero over-reach carries 🟡',
    rollup: asRollup({ pairs: 4, served: 1, missed: 2, overReach: 1 }),
    absent: '—',
    expected:
      '1 served · 🔴 2 missed · 0 lapsed · 0 self-cached · 🟡 1 over-reach · 0 unshared',
  },
  {
    description:
      'a nonzero lapse carries 🟡 — a real loss, yet the clock, never the layout',
    rollup: asRollup({ pairs: 3, missed: 1, lapsed: 2 }),
    absent: '—',
    expected:
      '0 served · 🔴 1 missed · 🟡 2 lapsed · 0 self-cached · 0 over-reach · 0 unshared',
  },
  {
    description: 'unmeasured pairs render only where nonzero, so the row sums',
    rollup: asRollup({ pairs: 3, selfCached: 1, unshared: 1, unmeasured: 1 }),
    absent: '—',
    expected:
      '0 served · 0 missed · 0 lapsed · 1 self-cached · 0 over-reach · 1 unshared · 1 unmeasured',
  },
];

describe('asPrefixVerdictRollupHuman', () => {
  given('[case1] a prefix verdict rollup and its absent count', () => {
    TEST_CASES.forEach((thisCase, index) =>
      when(`[t${index}] the rollup is rendered for a human`, () => {
        then(thisCase.description, () => {
          expect(
            asPrefixVerdictRollupHuman({
              rollup: thisCase.rollup,
              absent: thisCase.absent,
            }),
          ).toEqual(thisCase.expected);
        });
      }),
    );
  });
});
