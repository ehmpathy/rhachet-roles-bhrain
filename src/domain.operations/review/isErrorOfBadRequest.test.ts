import { BadRequestError, UnexpectedCodePathError } from 'helpful-errors';

import { isErrorOfBadRequest } from './isErrorOfBadRequest';

/**
 * .what = a BadRequestError from a SECOND copy of the class, as a duplicated dependency
 *         would raise it
 * .why = the copy shares the name but not the identity, which is the exact case
 *        `instanceof` misreads
 */
class BadRequestError2 extends Error {}
Object.defineProperty(BadRequestError2, 'name', { value: 'BadRequestError' });
class ConstraintErrorOfCopy extends BadRequestError2 {}

const TEST_CASES = [
  {
    description: 'the repo own BadRequestError is a caller fault',
    given: { error: new BadRequestError('bad flag') },
    expect: { output: true },
  },
  {
    description:
      'a same-named BadRequestError from another copy is a caller fault',
    given: { error: new BadRequestError2('bad flag') },
    expect: { output: true },
  },
  {
    description: 'a subclass of a copied BadRequestError is a caller fault',
    given: { error: new ConstraintErrorOfCopy('bad flag') },
    expect: { output: true },
  },
  {
    description: 'an UnexpectedCodePathError is not a caller fault',
    given: { error: new UnexpectedCodePathError('provider fell over') },
    expect: { output: false },
  },
  {
    description: 'a plain Error is not a caller fault',
    given: { error: new Error('timeout') },
    expect: { output: false },
  },
  {
    description: 'a thrown primitive is not a caller fault',
    given: { error: 'BadRequestError' },
    expect: { output: false },
  },
];

describe('isErrorOfBadRequest', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(isErrorOfBadRequest({ error: thisCase.given.error })).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
