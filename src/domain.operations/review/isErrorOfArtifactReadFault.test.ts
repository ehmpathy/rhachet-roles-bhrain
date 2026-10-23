import { isErrorOfArtifactReadFault } from '@src/domain.operations/review/isErrorOfArtifactReadFault';

/**
 * .what = an error shaped as node's fs rejection, with the given errno
 */
const asFsError = (code: string): Error =>
  Object.assign(new Error(`${code}: fault`), { code });

const TEST_CASES = [
  {
    description: 'a denial is a fault of the artifact',
    given: { error: asFsError('EACCES') },
    expect: { output: true },
  },
  {
    description: 'an ownership denial is a fault of the artifact',
    given: { error: asFsError('EPERM') },
    expect: { output: true },
  },
  {
    description: 'a dir where a file was is a fault of the artifact',
    given: { error: asFsError('EISDIR') },
    expect: { output: true },
  },
  {
    description: 'an io fault is a fault of the artifact',
    given: { error: asFsError('EIO') },
    expect: { output: true },
  },
  {
    description: 'a descriptor quota hit is a fault of the artifact',
    given: { error: asFsError('EMFILE') },
    expect: { output: true },
  },
  {
    description: 'a bad argument is a defect in the caller, never the artifact',
    given: { error: asFsError('ERR_INVALID_ARG_VALUE') },
    expect: { output: false },
  },
  {
    description: 'a throw with no errno is a defect, never an artifact fault',
    given: { error: new TypeError('boom') },
    expect: { output: false },
  },
  {
    description: 'a non-error throw is never an artifact fault',
    given: { error: 'boom' },
    expect: { output: false },
  },
];

describe('isErrorOfArtifactReadFault', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(isErrorOfArtifactReadFault({ error: thisCase.given.error })).toBe(
        thisCase.expect.output,
      );
    }),
  );
});
