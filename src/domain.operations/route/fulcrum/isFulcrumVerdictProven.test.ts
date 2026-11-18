import type { FulcrumVerdictRow } from '@src/domain.objects/Driver/FulcrumVerdictRow';

import { isFulcrumVerdictProven } from './isFulcrumVerdictProven';
import { isFulcrumVerdictReopened } from './isFulcrumVerdictReopened';

const ROW_F44_UPHELD: FulcrumVerdictRow = {
  case: 'F44',
  ruled: 'upheld',
  on: '2026-11-17',
  seen: 'hash-read',
};

const TEST_CASES: {
  description: string;
  given: {
    case: string;
    ruled: 'upheld' | 'conceded';
    seen: string;
    rows: FulcrumVerdictRow[];
  };
  expect: { proven: boolean; reopened: boolean };
}[] = [
  {
    description: 'a verdict the lever wrote, on the content it read, is proven',
    given: {
      case: 'F44',
      ruled: 'upheld',
      seen: 'hash-read',
      rows: [ROW_F44_UPHELD],
    },
    expect: { proven: true, reopened: false },
  },
  {
    description: 'a verdict with no ledger row is not proven (a hand edit)',
    given: { case: 'F44', ruled: 'upheld', seen: 'hash-read', rows: [] },
    expect: { proven: false, reopened: false },
  },
  {
    description:
      'a yaml verdict that contradicts its ledger row is not proven (a hand flip)',
    given: {
      case: 'F44',
      ruled: 'conceded',
      seen: 'hash-read',
      rows: [ROW_F44_UPHELD],
    },
    expect: { proven: false, reopened: false },
  },
  {
    description:
      'an entry edited after the verdict is not proven, and reads as reopened (a concern added to holds)',
    given: {
      case: 'F44',
      ruled: 'upheld',
      seen: 'hash-edited',
      rows: [ROW_F44_UPHELD],
    },
    expect: { proven: false, reopened: true },
  },
  {
    description:
      'a superseded row proves naught once a newer row rules the case otherwise',
    given: {
      case: 'F44',
      ruled: 'upheld',
      seen: 'hash-read',
      rows: [ROW_F44_UPHELD, { ...ROW_F44_UPHELD, ruled: 'conceded' }],
    },
    expect: { proven: false, reopened: false },
  },
  {
    description: 'the newest row proves the verdict it carries',
    given: {
      case: 'F44',
      ruled: 'conceded',
      seen: 'hash-read',
      rows: [ROW_F44_UPHELD, { ...ROW_F44_UPHELD, ruled: 'conceded' }],
    },
    expect: { proven: true, reopened: false },
  },
  {
    description: "another case's row proves naught for this one",
    given: {
      case: 'F47',
      ruled: 'upheld',
      seen: 'hash-read',
      rows: [ROW_F44_UPHELD],
    },
    expect: { proven: false, reopened: false },
  },
];

describe('isFulcrumVerdictProven', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(isFulcrumVerdictProven(thisCase.given)).toEqual(
        thisCase.expect.proven,
      );
      expect(isFulcrumVerdictReopened(thisCase.given)).toEqual(
        thisCase.expect.reopened,
      );
    }),
  );
});
