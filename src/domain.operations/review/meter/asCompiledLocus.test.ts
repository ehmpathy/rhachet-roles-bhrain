import { getError } from 'test-fns';

import { ReviewRunArtifactError } from '@src/domain.operations/review/ReviewRunArtifactError';

import { asCompiledLocus } from './asCompiledLocus';

/**
 * .what = the three states a `locus` row can be read in, each kept as itself
 * .why = an absent row is UNREAD, an empty list is a FACT, and a malformed row is
 *        corrupt — a read that conflates any two would launder one into another
 */
const TEST_CASES = [
  {
    description: 'an absent row reads as null — unread, never a claim of none',
    given: { value: undefined },
    expect: { output: null },
  },
  {
    description: 'a null row reads as null — the walk wrote no answer',
    given: { value: null },
    expect: { output: null },
  },
  {
    description: 'an empty list is a FACT — the walk placed no target',
    given: { value: [] },
    expect: { output: [] },
  },
  {
    description: 'a list of { path, chars } is the measured locus',
    given: { value: [{ path: 'src/a.ts', chars: 12 }] },
    expect: { output: [{ path: 'src/a.ts', chars: 12 }] },
  },
];

const MALFORMED_CASES = [
  {
    description: 'an object where a list belongs',
    given: { value: { path: 'a' } },
  },
  {
    description: 'an entry with no chars',
    given: { value: [{ path: 'src/a.ts' }] },
  },
  {
    description: 'an entry whose chars is a string',
    given: { value: [{ path: 'src/a.ts', chars: '12' }] },
  },
];

describe('asCompiledLocus', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const output = asCompiledLocus({
        value: thisCase.given.value,
        dir: '/run',
      });
      expect(output).toEqual(thisCase.expect.output);

      // the whole state per case, so each of the three is eyeballed in a pr diff
      expect(output).toMatchSnapshot();
    }),
  );

  MALFORMED_CASES.map((thisCase) =>
    test(`🔴 ${thisCase.description} fails loud, never reads as absent`, async () => {
      const error = await getError(async () =>
        asCompiledLocus({ value: thisCase.given.value, dir: '/run' }),
      );
      expect(error).toBeInstanceOf(ReviewRunArtifactError);
      expect(error.message).toContain('locus row');
    }),
  );
});
