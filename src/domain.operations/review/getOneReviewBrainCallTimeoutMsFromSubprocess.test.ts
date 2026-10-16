import { given, then, when } from 'test-fns';

import { getOneReviewBrainCallTimeoutMsFromSubprocess } from './getOneReviewBrainCallTimeoutMsFromSubprocess';

const TEST_CASES = [
  {
    description:
      'the guard default of 21 minutes leaves the inner bound one minute below',
    given: { subprocessMs: 21 * 60 * 1000 },
    expect: { brainCallMs: 20 * 60 * 1000 },
  },
  {
    description: 'a short bound leaves the inner bound a tenth below',
    given: { subprocessMs: 5_000 },
    expect: { brainCallMs: 4_500 },
  },
  {
    description: 'a 1ms bound floors the inner bound at 1ms, never zero',
    given: { subprocessMs: 1 },
    expect: { brainCallMs: 1 },
  },
];

describe('getOneReviewBrainCallTimeoutMsFromSubprocess', () => {
  given('[case1] a subprocess bound', () => {
    when('[t0] the brain-call bound is derived', () => {
      TEST_CASES.map((thisCase) =>
        then(thisCase.description, () => {
          expect(
            getOneReviewBrainCallTimeoutMsFromSubprocess({
              subprocessMs: thisCase.given.subprocessMs,
            }),
          ).toEqual(thisCase.expect.brainCallMs);
        }),
      );

      then(
        'the inner bound is strictly below the outer for any real bound',
        () => {
          [2, 10, 999, 60_000, 600_000, 21 * 60 * 1000, 3_600_000].map(
            (subprocessMs) =>
              expect(
                getOneReviewBrainCallTimeoutMsFromSubprocess({ subprocessMs }),
              ).toBeLessThan(subprocessMs),
          );
        },
      );
    });
  });
});
