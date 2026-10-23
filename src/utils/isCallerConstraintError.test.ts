import { BadRequestError, UnexpectedCodePathError } from 'helpful-errors';

import { isCallerConstraintError } from './isCallerConstraintError';

/**
 * .what = an error shaped like a ConstraintError from a foreign helpful-errors copy
 * .why = `instanceof` fails across package copies; only the `code.exit` field is shared
 */
class ForeignConstraintError extends Error {
  public get code(): { http: number; exit: number } {
    return { http: 400, exit: 2 };
  }
}

const TEST_CASES = [
  {
    description: 'this package BadRequestError is a constraint',
    given: { error: new BadRequestError('bad input') },
    expect: { output: true },
  },
  {
    description: 'a foreign-copy constraint (code.exit = 2) is a constraint',
    given: { error: new ForeignConstraintError('key absent') },
    expect: { output: true },
  },
  {
    description:
      'an UnexpectedCodePathError (a malfunction) is not a constraint',
    given: { error: new UnexpectedCodePathError('broke') },
    expect: { output: false },
  },
  {
    description: 'a plain Error is not a constraint',
    given: { error: new Error('plain') },
    expect: { output: false },
  },
  {
    description: 'a non-error value is not a constraint',
    given: { error: { code: { exit: 2 } } },
    expect: { output: false },
  },
];

describe('isCallerConstraintError', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(isCallerConstraintError(thisCase.given.error)).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
