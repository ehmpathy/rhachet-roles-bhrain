import { given, then, when } from 'test-fns';

import { getOneReviewBrainCallResidualMs } from './getOneReviewBrainCallResidualMs';

const MS_OF_START = 1_000_000;

const TEST_CASES = [
  {
    description: 'no prior work leaves the whole bound',
    given: {
      clock: { msOfReviewStart: MS_OF_START, brainCallTimeoutMs: 20 * 60_000 },
      msOfNow: MS_OF_START,
    },
    expect: { residualMs: 20 * 60_000 },
  },
  {
    description: 'a two-minute prime meet is charged against the bound',
    given: {
      clock: { msOfReviewStart: MS_OF_START, brainCallTimeoutMs: 20 * 60_000 },
      msOfNow: MS_OF_START + 2 * 60_000,
    },
    expect: { residualMs: 18 * 60_000 },
  },
  {
    description: 'prior work that spent the whole bound leaves 1ms, never zero',
    given: {
      clock: { msOfReviewStart: MS_OF_START, brainCallTimeoutMs: 20 * 60_000 },
      msOfNow: MS_OF_START + 25 * 60_000,
    },
    expect: { residualMs: 1 },
  },
  {
    description: 'a clock that ran backward charges naught',
    given: {
      clock: { msOfReviewStart: MS_OF_START, brainCallTimeoutMs: 5_000 },
      msOfNow: MS_OF_START - 300,
    },
    expect: { residualMs: 5_000 },
  },
];

describe('getOneReviewBrainCallResidualMs', () => {
  given('[case1] a lane clock and the instant the brain call starts', () => {
    when('[t0] the brain call share is derived', () => {
      TEST_CASES.map((thisCase) =>
        then(thisCase.description, () => {
          expect(getOneReviewBrainCallResidualMs(thisCase.given)).toEqual(
            thisCase.expect.residualMs,
          );
        }),
      );
    });
  });
});
