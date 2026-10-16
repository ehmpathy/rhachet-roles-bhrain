import { asStoneGuardPartitionGapReason } from './asStoneGuardPartitionGapReason';

/**
 * .what = the recorded reason names the cause in every gap shape
 * .why = clamp: the reason once named only unclaimed files, so a gap whose sole defect was
 *        a partition without the route spec recorded a sentence that ended at its colon
 */
const TEST_CASES = [
  {
    description: 'unclaimed files only',
    given: { gaps: [{ unclaimed: ['a.ts', 'b.ts'], routeAbsentFrom: [] }] },
    expect: {
      output:
        'peer review partitions cannot hold the branch: no partition claims a.ts, b.ts',
    },
  },
  {
    description: 'a partition without the route spec only',
    given: { gaps: [{ unclaimed: [], routeAbsentFrom: ['meter'] }] },
    expect: {
      output:
        'peer review partitions cannot hold the branch: the route spec is absent from meter',
    },
  },
  {
    description: 'both, across two scopes',
    given: {
      gaps: [
        { unclaimed: ['a.ts'], routeAbsentFrom: [] },
        { unclaimed: [], routeAbsentFrom: ['meter', 'warmer'] },
      ],
    },
    expect: {
      output:
        'peer review partitions cannot hold the branch: no partition claims a.ts; the route spec is absent from meter, warmer',
    },
  },
];

describe('asStoneGuardPartitionGapReason', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asStoneGuardPartitionGapReason(thisCase.given)).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
