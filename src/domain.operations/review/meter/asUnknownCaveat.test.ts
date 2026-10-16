import { asUnknownCaveat } from './asUnknownCaveat';

const TEST_CASES = [
  {
    description: 'no unknown run carries no caveat — never a `+0 unknown`',
    given: { unknown: 0 },
    expect: { output: '' },
  },
  {
    description: 'one unknown run is named, and named as not zero',
    given: { unknown: 1 },
    expect: { output: '  🟡 +1 unknown (cost unrecorded, not zero)' },
  },
  {
    description: 'many unknown runs are counted',
    given: { unknown: 38 },
    expect: { output: '  🟡 +38 unknown (cost unrecorded, not zero)' },
  },
];

describe('asUnknownCaveat', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asUnknownCaveat(thisCase.given)).toEqual(thisCase.expect.output);
    }),
  );
});
