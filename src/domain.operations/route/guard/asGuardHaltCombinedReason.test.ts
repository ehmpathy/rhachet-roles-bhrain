import { asGuardHaltCombinedReason } from './asGuardHaltCombinedReason';

const TEST_CASES = [
  {
    description: 'exhaustion alone reads as itself',
    given: { hasMalfunction: false, hasConstraint: false },
    expect: { output: 'budget exhausted' },
  },
  {
    description: 'a malfunction leads, exhaustion last',
    given: { hasMalfunction: true, hasConstraint: false },
    expect: { output: 'reviewer or judge malfunctioned; budget exhausted' },
  },
  {
    description: 'a constraint sits before exhaustion',
    given: { hasMalfunction: false, hasConstraint: true },
    expect: { output: 'reviewer constraint; budget exhausted' },
  },
  {
    description: 'all three read in precedence order',
    given: { hasMalfunction: true, hasConstraint: true },
    expect: {
      output:
        'reviewer or judge malfunctioned; reviewer constraint; budget exhausted',
    },
  },
];

describe('asGuardHaltCombinedReason', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const output = asGuardHaltCombinedReason({
        ...thisCase.given,
        exhaustedReason: 'budget exhausted',
      });
      expect(output).toEqual(thisCase.expect.output);
    }),
  );
});
