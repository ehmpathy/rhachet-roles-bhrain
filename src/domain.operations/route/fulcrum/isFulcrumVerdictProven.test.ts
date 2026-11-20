import type { FulcrumVerdictRow } from '@src/domain.objects/Driver/FulcrumVerdictRow';

import { isFulcrumVerdictProven } from './isFulcrumVerdictProven';
import { isFulcrumVerdictReopened } from './isFulcrumVerdictReopened';

const KEY_SEEN = '1.vision:rules:r001.rules.md:blocker.1';
const KEY_NEWER = '5.1.execution:rules:r004.rules.md:blocker.2';

const ROW_F44_UPHELD: FulcrumVerdictRow = {
  case: 'F44',
  ruled: 'upheld',
  on: '2026-11-17',
  seen: 'hash-read',
  held: [KEY_SEEN],
  after: 1,
};

const TEST_CASES: {
  description: string;
  given: {
    case: string;
    ruled: 'upheld' | 'conceded';
    seen: string;
    disputes: string[];
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
      disputes: [KEY_SEEN],
      rows: [ROW_F44_UPHELD],
    },
    expect: { proven: true, reopened: false },
  },
  {
    description: 'a verdict with no ledger row is not proven (a hand edit)',
    given: {
      case: 'F44',
      ruled: 'upheld',
      seen: 'hash-read',
      disputes: [KEY_SEEN],
      rows: [],
    },
    expect: { proven: false, reopened: false },
  },
  {
    description:
      'a yaml verdict that contradicts its ledger row is not proven (a hand flip)',
    given: {
      case: 'F44',
      ruled: 'conceded',
      seen: 'hash-read',
      disputes: [KEY_SEEN],
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
      disputes: [KEY_SEEN],
      rows: [ROW_F44_UPHELD],
    },
    expect: { proven: false, reopened: true },
  },
  {
    description:
      '🔴 a dispute the verdict never held is not proven, and reads as reopened (a re-dispute on unedited content)',
    given: {
      case: 'F44',
      ruled: 'upheld',
      seen: 'hash-read',
      disputes: [KEY_SEEN, KEY_NEWER],
      rows: [ROW_F44_UPHELD],
    },
    expect: { proven: false, reopened: true },
  },
  {
    description:
      'a dispute the verdict held, since rewound, leaves the verdict proven',
    given: {
      case: 'F44',
      ruled: 'upheld',
      seen: 'hash-read',
      disputes: [],
      rows: [ROW_F44_UPHELD],
    },
    expect: { proven: true, reopened: false },
  },
  {
    description:
      'a superseded row proves naught once a newer row rules the case otherwise',
    given: {
      case: 'F44',
      ruled: 'upheld',
      seen: 'hash-read',
      disputes: [KEY_SEEN],
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
      disputes: [KEY_SEEN],
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
      disputes: [KEY_SEEN],
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
