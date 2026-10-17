import { given, then, when } from 'test-fns';

import { asSnapshotTestNameOfFirstAttempt } from './asSnapshotTestNameOfFirstAttempt';

/**
 * .what = the snapshot state counts this clamp reads; jest-snapshot keeps them private
 * .why = a write of a new key is the defect, and `added` is where jest counts it
 */
type SnapshotStateCounts = { added: number; unmatched: number };
const getSnapshotStateCounts = (): SnapshotStateCounts =>
  expect.getState().snapshotState as unknown as SnapshotStateCounts; // .note = no public api

const TEST_CASES = [
  {
    description: 'maps a later attempt onto attempt 1',
    given: 'suite given: [c1] x when: [t0] y, attempt 3 then: z',
    expect: 'suite given: [c1] x when: [t0] y, attempt 1 then: z',
  },
  {
    description: 'keeps attempt 1 as is',
    given: 'suite given: [c1] x when: [t0] y, attempt 1 then: z',
    expect: 'suite given: [c1] x when: [t0] y, attempt 1 then: z',
  },
  {
    description: 'keeps a plain name as is',
    given: 'suite given: [c1] x when: [t0] y then: z',
    expect: 'suite given: [c1] x when: [t0] y then: z',
  },
  {
    description: 'keeps an `attempt N` that is no repeatably suffix',
    given: 'suite given: [c1] a retry, attempt 2 of 5 when: [t0] y then: z',
    expect: 'suite given: [c1] a retry, attempt 2 of 5 when: [t0] y then: z',
  },
];

describe('withAttemptAgnosticSnapshots', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(
        asSnapshotTestNameOfFirstAttempt({ testName: thisCase.given }),
      ).toEqual(thisCase.expect);
    }),
  );

  given('[case1] a repeatably test that snapshots in each attempt', () => {
    when.repeatably({ attempts: 3, criteria: 'EVERY' })(
      '[t0] each attempt snapshots the same value',
      () => {
        then('the value matches the attempt-1 snapshot', () => {
          expect({ verdict: 'approved', blockers: 0 }).toMatchSnapshot();
        });

        then('no attempt writes a snapshot key of its own', () => {
          expect(getSnapshotStateCounts().added).toEqual(0);
          expect(getSnapshotStateCounts().unmatched).toEqual(0);
        });
      },
    );
  });
});
