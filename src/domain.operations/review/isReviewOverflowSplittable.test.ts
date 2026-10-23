import { isReviewOverflowSplittable } from './isReviewOverflowSplittable';

const TEST_CASES = [
  {
    description: 'an overflowed whole run with a declared partition splits',
    given: { overflowed: true, partitionsDeclared: 1, isPartitionRun: false },
    expect: true,
  },
  {
    description: 'a run that fits never splits, even with partitions declared',
    given: { overflowed: false, partitionsDeclared: 2, isPartitionRun: false },
    expect: false,
  },
  {
    description: 'an overflow with no partition declared refuses, never splits',
    given: { overflowed: true, partitionsDeclared: 0, isPartitionRun: false },
    expect: false,
  },
  {
    description: 'an overflowed partition run never splits a second time',
    given: { overflowed: true, partitionsDeclared: 2, isPartitionRun: true },
    expect: false,
  },
];

describe('isReviewOverflowSplittable', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(isReviewOverflowSplittable(thisCase.given)).toEqual(
        thisCase.expect,
      );
    }),
  );
});
