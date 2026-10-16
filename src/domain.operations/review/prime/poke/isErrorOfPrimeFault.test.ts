import { ReviewBrainCallError } from '@src/domain.operations/review/ReviewBrainCallError';

import { isErrorOfPrimeFault } from './isErrorOfPrimeFault';

const TEST_CASES = [
  {
    description: 'a dropped brain call is a fault the pour survives',
    given: {
      error: new ReviewBrainCallError({ error: new Error('terminated') }),
    },
    expect: { output: true },
  },
  {
    description: 'a provider refusal is a fault the pour survives',
    given: { error: new Error('400 prompt is too long') },
    expect: { output: true },
  },
  {
    description: 'a bad property read is a defect, and rethrows',
    given: { error: new TypeError('cannot read properties of undefined') },
    expect: { output: false },
  },
  {
    description: 'a non-error throw is never a fault',
    given: { error: 'a bare string' },
    expect: { output: false },
  },
];

describe('isErrorOfPrimeFault', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(isErrorOfPrimeFault({ error: thisCase.given.error })).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
