import { asWarmerLastPokedAt } from '@src/domain.operations/review/warmer/asWarmerLastPokedAt';

const TEST_CASES: {
  description: string;
  given: { lastAt: string | null };
  expect: string | null;
}[] = [
  {
    description: 'a parseable stamp casts to its instant',
    given: { lastAt: '2026-09-18T00:15:00.000Z' },
    expect: '2026-09-18T00:15:00.000Z',
  },
  {
    description: 'a ledger with no row has no instant',
    given: { lastAt: null },
    expect: null,
  },
  {
    description:
      '🔴 a stamp that does not parse reads the same as an absent row',
    given: { lastAt: 'not-a-stamp' },
    expect: null,
  },
];

describe('asWarmerLastPokedAt', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const lastAt = asWarmerLastPokedAt({ warmer: thisCase.given });
      expect(lastAt === null ? null : lastAt.toISOString()).toEqual(
        thisCase.expect,
      );
    }),
  );
});
