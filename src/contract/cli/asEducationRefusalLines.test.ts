import { ConstraintError } from 'helpful-errors';

import { asEducationRefusalLines } from './asEducationRefusalLines';

const TEST_CASES: Array<{
  description: string;
  given: { message: string; metadata: Record<string, unknown> };
  expected: string[];
}> = [
  {
    description: 'a camelCase key reads as words, and one value is a leaf',
    given: {
      message: 'a pursuit with no course cannot graduate',
      metadata: { pursuitRoute: '.route/x', hint: 'pursue a course first' },
    },
    expected: [
      '✋ ConstraintError: a pursuit with no course cannot graduate',
      '   ├─ pursuit route = .route/x',
      '   └─ fix: pursue a course first',
    ],
  },
  {
    description: 'a list of two or more is a label over child branches',
    given: {
      message: 'no role mechanik in this repo',
      metadata: {
        role: 'mechanik',
        rolesFound: ['mechanic (native)', 'driver (linked, bhrain)'],
        hint: 'did you mean --for mechanic?',
      },
    },
    expected: [
      '✋ ConstraintError: no role mechanik in this repo',
      '   ├─ role = mechanik',
      '   ├─ roles found',
      '   │  ├─ mechanic (native)',
      '   │  └─ driver (linked, bhrain)',
      '   └─ fix: did you mean --for mechanic?',
    ],
  },
  {
    description: 'a list of one stays a leaf, and null reads as none',
    given: {
      message: 'a course runs only within a pursuit',
      metadata: { coursesOpen: ['.route/x/course=1.a'], bound: null },
    },
    expected: [
      '✋ ConstraintError: a course runs only within a pursuit',
      '   ├─ courses open = .route/x/course=1.a',
      '   ├─ bound = (none)',
      '   └─ fix: clear the cause above, then rerun',
    ],
  },
];

describe('asEducationRefusalLines', () => {
  TEST_CASES.forEach((thisCase) => {
    test(thisCase.description, () => {
      const error = new ConstraintError(
        thisCase.given.message,
        thisCase.given.metadata,
      );
      expect(asEducationRefusalLines({ error })).toEqual(thisCase.expected);
    });
  });
});
