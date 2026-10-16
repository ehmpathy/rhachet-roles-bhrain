import { runInNewContext } from 'vm';

import { ReviewBrainCallError } from '@src/domain.operations/review/ReviewBrainCallError';
import { ReviewTimeoutError } from '@src/domain.operations/review/ReviewTimeoutError';

import { isErrorOfPokeFault } from './isErrorOfPokeFault';

const TEST_CASES = [
  {
    description: 'a provider refusal is a fault',
    given: { error: new Error('429 rate limited') },
    expect: { output: true },
  },
  {
    description: 'the poke timeout is a fault, by its brain-fault name',
    given: {
      error: new ReviewBrainCallError({
        error: new ReviewTimeoutError({ timeoutMs: 50 }),
      }),
    },
    expect: { output: true },
  },
  {
    description: 'the deadline timeout beneath it is a fault, by name',
    given: { error: new ReviewTimeoutError({ timeoutMs: 50 }) },
    expect: { output: true },
  },
  {
    // the realm clamp for the allowlist: a brain-fault name from another realm
    description: 'a brain-fault name from another realm is still a fault',
    given: {
      error: runInNewContext(
        'Object.assign(new Error("the brain call failed"), { name: "ReviewBrainCallError" })',
      ) as unknown,
    },
    expect: { output: true },
  },
  {
    description: 'a bad property read is a defect, never a fault',
    given: { error: new TypeError('cannot read properties of undefined') },
    expect: { output: false },
  },
  {
    description: 'an unbound name is a defect, never a fault',
    given: { error: new ReferenceError('poke is not defined') },
    expect: { output: false },
  },
  {
    // the realm clamp: an `instanceof Error` gate reads this as a non-error and
    // rethrows it, which fails a review over a cache optimization
    description: 'a provider fault from another realm is still a fault',
    given: {
      error: runInNewContext('new Error("503 upstream")') as unknown,
    },
    expect: { output: true },
  },
  {
    description: 'a defect from another realm is still a defect',
    given: {
      error: runInNewContext('new TypeError("x is undefined")') as unknown,
    },
    expect: { output: false },
  },
  {
    description: 'a non-error throw is never a fault',
    given: { error: 'a bare string' },
    expect: { output: false },
  },
];

describe('isErrorOfPokeFault', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(isErrorOfPokeFault({ error: thisCase.given.error })).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
