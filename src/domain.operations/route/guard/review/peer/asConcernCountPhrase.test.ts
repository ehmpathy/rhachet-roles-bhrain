import { asConcernCountPhrase } from './asConcernCountPhrase';

const TEST_CASES = [
  {
    description: 'zero reads plural',
    given: { count: 0, kind: 'blockers' as const },
    expect: '0 blockers',
  },
  {
    description: 'one reads singular',
    given: { count: 1, kind: 'blockers' as const },
    expect: '1 blocker',
  },
  {
    description: 'one nitpick reads singular',
    given: { count: 1, kind: 'nitpicks' as const },
    expect: '1 nitpick',
  },
  {
    description: 'several read plural',
    given: { count: 3, kind: 'nitpicks' as const },
    expect: '3 nitpicks',
  },
];

describe('asConcernCountPhrase', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asConcernCountPhrase(thisCase.given)).toEqual(thisCase.expect);
    }),
  );
});
