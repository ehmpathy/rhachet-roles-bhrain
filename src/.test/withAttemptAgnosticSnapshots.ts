import { toMatchSnapshot } from 'jest-snapshot';

import { asSnapshotTestNameOfFirstAttempt } from './asSnapshotTestNameOfFirstAttempt';

/**
 * .what = the snapshot state field this wrapper sets; jest-snapshot keeps it private
 * .why = the key counter must restart per attempt, or attempt 2 checks key `… 2`
 */
type SnapshotStateCounters = { _counters: Map<string, number> };

/**
 * .what = calls to `toMatchSnapshot` so far in the current test
 * .why = the attempt-1 key counter is set to this count, so each attempt checks the keys
 *        attempt 1 wrote, in the order it wrote them. a jest retry restarts it too
 */
let callsInTest = 0;
beforeEach(() => {
  callsInTest = 0;
});

/**
 * .what = `toMatchSnapshot`, keyed by the attempt-1 name of a `when.repeatably` test
 * .why = in ci a later attempt checked a key no snap file holds, failed, and voided the retry;
 *        locally a resnap wrote keys for attempt 2 and 3. now every attempt checks one baseline
 * .note = a name with no `, attempt N` maps to itself, so a plain test is untouched
 */
export const toMatchSnapshotOfFirstAttempt: typeof toMatchSnapshot = function (
  this: ThisParameterType<typeof toMatchSnapshot>,
  ...args: Parameters<typeof toMatchSnapshot>
) {
  // compute the attempt-1 name of this test
  const testNameActual = this.currentTestName ?? '';
  const testNameFirst = asSnapshotTestNameOfFirstAttempt({
    testName: testNameActual,
  });

  // align the attempt-1 key counter with this attempt's own call count
  const callsPrior = callsInTest;
  callsInTest += 1;
  const state = this.snapshotState as unknown as SnapshotStateCounters; // .note = jest-snapshot exposes no counter api
  if (testNameFirst !== testNameActual)
    state._counters.set(testNameFirst, callsPrior);

  // match under the attempt-1 name
  return toMatchSnapshot.call(
    {
      ...this,
      currentTestName: testNameFirst,
      currentConcurrentTestName: undefined,
    },
    ...args,
  );
};

// .note = jest-snapshot types its matcher context apart from @types/jest; the runtime is one
expect.extend({
  toMatchSnapshot:
    toMatchSnapshotOfFirstAttempt as unknown as jest.CustomMatcher,
});
