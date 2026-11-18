import { isFulcrumHoldsOfConcern } from './isFulcrumHoldsOfConcern';

const TEST_CASES: Array<{
  description: string;
  given: { holds: string[]; reviewer: string; about: string };
  expect: boolean;
}> = [
  {
    description: 'a hold of the same reviewer and concern names it',
    given: {
      holds: ['rules/i003/blocker.2'],
      reviewer: 'rules',
      about: 'blocker.2',
    },
    expect: true,
  },
  {
    description: 'any round of the same reviewer and concern names it',
    given: {
      holds: ['lint/i001/nitpick.1', 'rules/i004/blocker.2'],
      reviewer: 'rules',
      about: 'blocker.2',
    },
    expect: true,
  },
  {
    description: 'empty holds name no concern',
    given: { holds: [], reviewer: 'rules', about: 'blocker.2' },
    expect: false,
  },
  {
    description: 'another reviewer of the same ordinal does not name it',
    given: {
      holds: ['lint/i003/blocker.2'],
      reviewer: 'rules',
      about: 'blocker.2',
    },
    expect: false,
  },
  {
    description:
      'a prefix ordinal does not name it (blocker.1 is not blocker.12)',
    given: {
      holds: ['rules/i003/blocker.12'],
      reviewer: 'rules',
      about: 'blocker.1',
    },
    expect: false,
  },
];

describe('isFulcrumHoldsOfConcern', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(isFulcrumHoldsOfConcern(thisCase.given)).toEqual(thisCase.expect);
    }),
  );
});
