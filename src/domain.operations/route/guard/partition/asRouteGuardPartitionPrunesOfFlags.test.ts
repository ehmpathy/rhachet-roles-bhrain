import { asRouteGuardPartitionPrunesOfFlags } from './asRouteGuardPartitionPrunesOfFlags';

/**
 * .what = data-driven cases for asRouteGuardPartitionPrunesOfFlags across --prune / --from
 *         counts
 * .why = each branch either pairs prunes with a home (or none) or refuses with a fault a human
 *        reads; a mispaired prune would drop a glob from the wrong partition
 */
const CASES: {
  description: string;
  prune: string[];
  from: string[];
  expected: ReturnType<typeof asRouteGuardPartitionPrunesOfFlags>;
}[] = [
  {
    description: 'no --from → each glob drops wherever it sits',
    prune: ['a/**', 'b/**'],
    from: [],
    expected: {
      prunes: [
        { glob: 'a/**', from: null },
        { glob: 'b/**', from: null },
      ],
      fault: null,
    },
  },
  {
    description: 'one --from for two prunes → both share it',
    prune: ['a/**', 'b/**'],
    from: ['review'],
    expected: {
      prunes: [
        { glob: 'a/**', from: 'review' },
        { glob: 'b/**', from: 'review' },
      ],
      fault: null,
    },
  },
  {
    description: 'one --from per prune → paired by position',
    prune: ['a/**', 'b/**'],
    from: ['x', 'y'],
    expected: {
      prunes: [
        { glob: 'a/**', from: 'x' },
        { glob: 'b/**', from: 'y' },
      ],
      fault: null,
    },
  },
  {
    description: 'three prunes beside two --from → the count-mismatch fault',
    prune: ['a/**', 'b/**', 'c/**'],
    from: ['x', 'y'],
    expected: {
      prunes: [],
      fault:
        '3 --prune beside 2 --from — give one --from for all, one per --prune, or none',
    },
  },
];

describe('asRouteGuardPartitionPrunesOfFlags', () => {
  CASES.forEach((thisCase) =>
    test(thisCase.description, () => {
      expect(
        asRouteGuardPartitionPrunesOfFlags({
          prune: thisCase.prune,
          from: thisCase.from,
        }),
      ).toEqual(thisCase.expected);
    }),
  );
});
