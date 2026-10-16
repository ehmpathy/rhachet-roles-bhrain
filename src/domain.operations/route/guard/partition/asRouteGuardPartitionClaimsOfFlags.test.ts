import { asRouteGuardPartitionClaimsOfFlags } from './asRouteGuardPartitionClaimsOfFlags';

/**
 * .what = data-driven cases for asRouteGuardPartitionClaimsOfFlags across --claim / --into counts
 * .why = each branch either pairs claims with a home or refuses with a fault a human reads;
 *        a mispaired claim would grow the wrong held partition, and a lost fault would guess
 */
const CASES: {
  description: string;
  claim: string[];
  into: string[];
  expected: ReturnType<typeof asRouteGuardPartitionClaimsOfFlags>;
}[] = [
  {
    description: 'no --into → the fault that names --into',
    claim: ['src/new/**'],
    into: [],
    expected: {
      claims: [],
      fault: '--claim needs --into <slug>, the held partition it joins',
    },
  },
  {
    description: 'one --into for two claims → both claims share it',
    claim: ['a/**', 'b/**'],
    into: ['review'],
    expected: {
      claims: [
        { glob: 'a/**', into: 'review' },
        { glob: 'b/**', into: 'review' },
      ],
      fault: null,
    },
  },
  {
    description: 'one --into per claim → paired by position',
    claim: ['a/**', 'b/**'],
    into: ['x', 'y'],
    expected: {
      claims: [
        { glob: 'a/**', into: 'x' },
        { glob: 'b/**', into: 'y' },
      ],
      fault: null,
    },
  },
  {
    description: 'three claims beside two --into → the count-mismatch fault',
    claim: ['a/**', 'b/**', 'c/**'],
    into: ['x', 'y'],
    expected: {
      claims: [],
      fault:
        '3 --claim beside 2 --into — give one --into for all, or one per --claim',
    },
  },
];

describe('asRouteGuardPartitionClaimsOfFlags', () => {
  CASES.forEach((thisCase) =>
    test(thisCase.description, () => {
      expect(
        asRouteGuardPartitionClaimsOfFlags({
          claim: thisCase.claim,
          into: thisCase.into,
        }),
      ).toEqual(thisCase.expected);
    }),
  );
});
