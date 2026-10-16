import { BadRequestError, ConstraintError } from 'helpful-errors';

import { asConstraintErrorHeadline } from './asConstraintErrorHeadline';

const TEST_CASES: Array<{
  description: string;
  given: {
    error: Parameters<typeof asConstraintErrorHeadline>[0]['error'];
  };
  expect: { output: string };
}> = [
  {
    description: 'strips the BadRequestError lead',
    given: { error: new BadRequestError('rubric not found: ghost') },
    expect: { output: 'rubric not found: ghost' },
  },
  {
    description: 'strips the ConstraintError lead',
    given: { error: new ConstraintError('brain is not registered') },
    expect: { output: 'brain is not registered' },
  },
  {
    description: 'leaves a class word inside the body as written',
    given: {
      error: new BadRequestError('a BadRequestError: was named in the body'),
    },
    expect: { output: 'a BadRequestError: was named in the body' },
  },
];

describe('asConstraintErrorHeadline', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(
        asConstraintErrorHeadline({ error: thisCase.given.error }),
      ).toEqual(thisCase.expect.output);
    }),
  );
});
