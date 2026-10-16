import type { ExitCodeClass } from '@src/domain.objects/Driver/ExitCodeClass';

import { isReviewRoundCompleted } from './isReviewRoundCompleted';

const TEST_CASES: {
  description: string;
  given: { exitClass: ExitCodeClass; blockers: number };
  expect: boolean;
}[] = [
  {
    description: 'a clean pass spends a round',
    given: { exitClass: 'passed', blockers: 0 },
    expect: true,
  },
  {
    description: 'a pass that carried blockers still spends a round',
    given: { exitClass: 'passed', blockers: 2 },
    expect: true,
  },
  {
    description:
      'a constraint exit with blockers is a review that found issues',
    given: { exitClass: 'constraint', blockers: 3 },
    expect: true,
  },
  {
    description:
      '🔴 a constraint exit with no blockers is a genuine constraint, and spends naught',
    given: { exitClass: 'constraint', blockers: 0 },
    expect: false,
  },
  {
    description: '🔴 a malfunction spends naught, whatever it counted',
    given: { exitClass: 'malfunction', blockers: 1 },
    expect: false,
  },
];

describe('isReviewRoundCompleted', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(isReviewRoundCompleted({ review: thisCase.given })).toEqual(
        thisCase.expect,
      );
    }),
  );
});
