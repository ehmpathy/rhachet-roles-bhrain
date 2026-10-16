import { UnexpectedCodePathError } from 'helpful-errors';

import { isErrorOfWriteRefusal } from './isErrorOfWriteRefusal';

/**
 * .what = an error shaped as node's fs rejection, with the given errno
 * .why = the predicate reads the code off the SHAPE, so a plain object with a
 *        string `code` is exactly what it must accept
 */
const asFsError = (code: string): Error =>
  Object.assign(new Error(`${code}: fs refused`), { code });

const TEST_CASES = [
  {
    description: 'a full disk is a refused write',
    given: { error: asFsError('ENOSPC') },
    expect: { output: true },
  },
  {
    description: 'a read-only mount is a refused write',
    given: { error: asFsError('EROFS') },
    expect: { output: true },
  },
  {
    description: 'a rename onto a directory is a refused write',
    given: { error: asFsError('EISDIR') },
    expect: { output: true },
  },
  {
    description: 'a code-less TypeError is a defect, never a refusal',
    given: { error: new TypeError('Do not know how to serialize a BigInt') },
    expect: { output: false },
  },
  {
    description: 'a helpful error is a defect, never a refusal',
    given: { error: new UnexpectedCodePathError('bad shape') },
    expect: { output: false },
  },
  {
    description: 'an errno no write should raise is not admitted by kind',
    given: { error: asFsError('ECONNRESET') },
    expect: { output: false },
  },
  {
    description: 'a thrown string is a defect',
    given: { error: 'boom' },
    expect: { output: false },
  },
];

describe('isErrorOfWriteRefusal', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(isErrorOfWriteRefusal({ error: thisCase.given.error })).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
