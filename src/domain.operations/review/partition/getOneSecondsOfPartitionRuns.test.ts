import { getOneSecondsOfPartitionRuns } from './getOneSecondsOfPartitionRuns';

/**
 * .what = a run that took the given seconds; only its time is read
 */
const asRunOfSeconds = (seconds: number) => ({
  metrics: { realized: { time: { seconds } } },
});

const TEST_CASES = [
  {
    description: 'no prime: the lane lasts as long as its slowest partition',
    given: { primed: null, results: [30, 45, 12] },
    expect: { seconds: 45 },
  },
  {
    description: 'a prime precedes the pour: prime + slowest partition',
    given: { primed: 8, results: [30, 45] },
    expect: { seconds: 53 },
  },
  {
    description: 'a prime with no partition left: the prime alone',
    given: { primed: 8, results: [] },
    expect: { seconds: 8 },
  },
  {
    description: 'no runs at all: zero, never -Infinity',
    given: { primed: null, results: [] },
    expect: { seconds: 0 },
  },
];

describe('getOneSecondsOfPartitionRuns', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const seconds = getOneSecondsOfPartitionRuns({
        primed:
          thisCase.given.primed === null
            ? null
            : asRunOfSeconds(thisCase.given.primed),
        results: thisCase.given.results.map(asRunOfSeconds),
      });
      expect(seconds).toEqual(thisCase.expect.seconds);
    }),
  );
});
