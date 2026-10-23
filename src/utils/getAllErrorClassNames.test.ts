import { ConstraintError } from 'helpful-errors';

import { getAllErrorClassNames } from './getAllErrorClassNames';

/**
 * .what = data-driven cases for getAllErrorClassNames across caught-value shapes
 * .why = the class-name walk is what parts a dependency's error copy from this repo's
 *        import; a primitive must yield no names, and a chain with no constructor must
 *        end without a throw
 */
class SurfError extends Error {}

const CASES: {
  description: string;
  error: unknown;
  expected: string[];
}[] = [
  {
    description: 'a string throw → no names',
    error: 'boom',
    expected: [],
  },
  {
    description: 'a null throw → no names',
    error: null,
    expected: [],
  },
  {
    description: 'a null-prototype object → no names, and no throw',
    error: Object.create(null),
    expected: [],
  },
  {
    description: 'a plain Error → Error, then Object',
    error: new Error('x'),
    expected: ['Error', 'Error', 'Object'],
  },
  {
    description: 'a subclass → the subclass, then its parents, nearest first',
    error: new SurfError('x'),
    expected: ['SurfError', 'SurfError', 'Error', 'Object'],
  },
];

describe('getAllErrorClassNames', () => {
  CASES.forEach((thisCase) =>
    test(thisCase.description, () => {
      expect(getAllErrorClassNames({ error: thisCase.error })).toEqual(
        thisCase.expected,
      );
    }),
  );

  test('a ConstraintError names itself and Error', () => {
    const names = getAllErrorClassNames({ error: new ConstraintError('x') });
    expect(names[0]).toEqual('ConstraintError');
    expect(names).toContain('Error');
  });
});
