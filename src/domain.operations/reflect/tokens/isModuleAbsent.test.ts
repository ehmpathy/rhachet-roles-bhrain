import { isModuleAbsent } from './isModuleAbsent';

/**
 * .what = an error that carries a node error code
 */
const genCodedError = (input: { code: string }): Error =>
  Object.assign(new Error('import failed'), { code: input.code });

const TEST_CASES = [
  {
    description: 'a commonjs absent module → absent',
    given: { error: genCodedError({ code: 'MODULE_NOT_FOUND' }) },
    expect: { output: true },
  },
  {
    description: 'a native esm absent module → absent',
    given: { error: genCodedError({ code: 'ERR_MODULE_NOT_FOUND' }) },
    expect: { output: true },
  },
  {
    description: 'a syntax fault inside an installed module → not absent',
    given: { error: new SyntaxError('unexpected token') },
    expect: { output: false },
  },
  {
    description: 'a non-error value → not absent',
    given: { error: 'MODULE_NOT_FOUND' },
    expect: { output: false },
  },
];

describe('isModuleAbsent', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(isModuleAbsent({ error: thisCase.given.error })).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
