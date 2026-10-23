import { MalfunctionError } from 'helpful-errors';

import { isErrorOfReplyCutAtOutputLimit } from './isErrorOfReplyCutAtOutputLimit';

const TEST_CASES = [
  {
    description: 'a reply cut at the output limit is detected',
    given: {
      error: new MalfunctionError('cut off', {
        finishReason: 'length',
        provider: 'InferenceNet',
        generationId: 'gen-1',
        contentLength: 0,
        tokensOutput: 131072,
        errorMessage: null,
      }),
    },
    expect: { output: true },
  },
  {
    description: 'a reply that failed mid-reply is not a cutoff',
    given: {
      error: new MalfunctionError('no usable reply', {
        finishReason: 'error',
      }),
    },
    expect: { output: false },
  },
  {
    description: 'a provider 504 is not a cutoff',
    given: { error: Object.assign(new Error('504'), { status: 504 }) },
    expect: { output: false },
  },
  {
    description: 'a bare error with no metadata is not a cutoff',
    given: { error: new Error('schema parse failed') },
    expect: { output: false },
  },
  {
    description: 'a non-object is not a cutoff',
    given: { error: 'boom' },
    expect: { output: false },
  },
];

describe('isErrorOfReplyCutAtOutputLimit', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(isErrorOfReplyCutAtOutputLimit(thisCase.given)).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
