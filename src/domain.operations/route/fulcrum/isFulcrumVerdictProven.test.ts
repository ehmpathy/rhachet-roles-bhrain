import type { FulcrumVerdictRow } from './getAllFulcrumVerdictRows';
import { isFulcrumVerdictProven } from './isFulcrumVerdictProven';

const ROW_F44_UPHELD: FulcrumVerdictRow = {
  case: 'F44',
  ruled: 'upheld',
  on: '2026-11-17',
};

const TEST_CASES: {
  description: string;
  given: {
    case: string;
    ruled: 'upheld' | 'conceded';
    rows: FulcrumVerdictRow[];
  };
  expect: { output: boolean };
}[] = [
  {
    description: 'a verdict the lever wrote is proven',
    given: { case: 'F44', ruled: 'upheld', rows: [ROW_F44_UPHELD] },
    expect: { output: true },
  },
  {
    description: 'a verdict with no ledger row is not proven (a hand edit)',
    given: { case: 'F44', ruled: 'upheld', rows: [] },
    expect: { output: false },
  },
  {
    description:
      'a yaml verdict that contradicts its ledger row is not proven (a hand flip)',
    given: { case: 'F44', ruled: 'conceded', rows: [ROW_F44_UPHELD] },
    expect: { output: false },
  },
  {
    description:
      'a superseded row proves naught once a newer row rules the case otherwise',
    given: {
      case: 'F44',
      ruled: 'upheld',
      rows: [ROW_F44_UPHELD, { ...ROW_F44_UPHELD, ruled: 'conceded' }],
    },
    expect: { output: false },
  },
  {
    description: 'the newest row proves the verdict it carries',
    given: {
      case: 'F44',
      ruled: 'conceded',
      rows: [ROW_F44_UPHELD, { ...ROW_F44_UPHELD, ruled: 'conceded' }],
    },
    expect: { output: true },
  },
  {
    description: "another case's row proves naught for this one",
    given: { case: 'F47', ruled: 'upheld', rows: [ROW_F44_UPHELD] },
    expect: { output: false },
  },
];

describe('isFulcrumVerdictProven', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(isFulcrumVerdictProven(thisCase.given)).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
