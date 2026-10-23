import { given, then, when } from 'test-fns';

import type { GuardPeerMeterStatus } from '../guard/tree/formatGuardTree';
import { asStoneGuardRoundIteration } from './asStoneGuardRoundIteration';

/**
 * .what = one peer meter, with only the given path varied per case
 * .why = the op reads `path` alone; every other field is held fixed
 */
const genMeter = (input: { path: string | null }): GuardPeerMeterStatus => ({
  index: 1,
  slug: 'lint',
  level: 1,
  rounds: 1,
  budget: 3,
  verdict: 'approved',
  awaits: false,
  blockers: 0,
  nitpicks: 0,
  overruled: false,
  skippedByDispute: false,
  disputed: { blockers: 0, nitpicks: 0 },
  path: input.path,
});

/**
 * .what = a given path minted in iteration `iter`
 */
const asGivenPath = (input: { iter: string }): string =>
  `.route/.reviews/peer/5.1.execution._.review.i${input.iter}.61cfdf378573c41488.r001._.given.by_peer.lint.md`;

const TEST_CASES: {
  description: string;
  given: { meters: GuardPeerMeterStatus[] };
  expect: { output: number | null };
}[] = [
  {
    description: '[case1] no meters at all',
    given: { meters: [] },
    expect: { output: null },
  },
  {
    description: '[case2] meters whose lanes have not spoken (no path)',
    given: {
      meters: [genMeter({ path: null }), genMeter({ path: null })],
    },
    expect: { output: null },
  },
  {
    description: '[case3] one lane spoke on one iteration',
    given: { meters: [genMeter({ path: asGivenPath({ iter: '004' }) })] },
    expect: { output: 4 },
  },
  {
    description:
      '[case4] lanes spoke on distinct iterations — the latest is the round',
    given: {
      meters: [
        genMeter({ path: asGivenPath({ iter: '002' }) }),
        genMeter({ path: asGivenPath({ iter: '011' }) }),
        genMeter({ path: asGivenPath({ iter: '007' }) }),
      ],
    },
    expect: { output: 11 },
  },
  {
    description:
      '[case5] an older given leads the list, and one lane has not spoken',
    given: {
      meters: [
        genMeter({ path: asGivenPath({ iter: '001' }) }),
        genMeter({ path: null }),
        genMeter({ path: asGivenPath({ iter: '003' }) }),
      ],
    },
    expect: { output: 3 },
  },
];

describe('asStoneGuardRoundIteration', () => {
  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      when('[t0] the round iteration is read', () => {
        then(`it reads ${String(thisCase.expect.output)}`, () => {
          expect(asStoneGuardRoundIteration(thisCase.given)).toEqual(
            thisCase.expect.output,
          );
        });
      });
    }),
  );
});
