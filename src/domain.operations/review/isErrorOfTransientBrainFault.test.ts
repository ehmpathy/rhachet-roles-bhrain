import { BadRequestError } from 'helpful-errors';

import { isErrorOfTransientBrainFault } from './isErrorOfTransientBrainFault';

const TEST_CASES = [
  {
    description: 'a provider 504 is transient',
    given: { error: Object.assign(new Error('504'), { status: 504 }) },
    expect: { output: true },
  },
  {
    description: 'a provider 502 is transient',
    given: { error: Object.assign(new Error('502'), { status: 502 }) },
    expect: { output: true },
  },
  {
    description: 'a rate limit is transient',
    given: { error: Object.assign(new Error('429'), { status: 429 }) },
    expect: { output: true },
  },
  {
    description: 'a dropped socket is transient',
    given: { error: Object.assign(new Error('reset'), { code: 'ECONNRESET' }) },
    expect: { output: true },
  },
  {
    description: 'a 400 is a caller fault, never retried',
    given: { error: Object.assign(new Error('400'), { status: 400 }) },
    expect: { output: false },
  },
  {
    description: 'a BadRequestError is a caller fault, never retried',
    given: { error: new BadRequestError('bad flag') },
    expect: { output: false },
  },
  {
    description: 'a bare error with no status or code is not transient',
    given: { error: new Error('schema parse failed') },
    expect: { output: false },
  },
  {
    description: 'a non-object is not transient',
    given: { error: 'boom' },
    expect: { output: false },
  },
  {
    // the shape node's fetch threw in round i021: `TypeError: terminated`, code on the cause
    description:
      "🔴 undici's dropped socket, its code one cause deep, is transient",
    given: {
      error: Object.assign(new TypeError('terminated'), {
        cause: Object.assign(new Error('other side closed'), {
          code: 'UND_ERR_SOCKET',
        }),
      }),
    },
    expect: { output: true },
  },
  {
    description: 'a transient code two causes deep is transient',
    given: {
      error: Object.assign(new Error('the brain call failed'), {
        cause: Object.assign(new TypeError('terminated'), {
          cause: Object.assign(new Error('reset'), { code: 'ECONNRESET' }),
        }),
      }),
    },
    expect: { output: true },
  },
  {
    description: 'a cause chain with no transient code is not transient',
    given: {
      error: Object.assign(new Error('outer'), {
        cause: new Error('schema parse failed'),
      }),
    },
    expect: { output: false },
  },
  {
    // the shared cycle-safe walk sees every link; a private depth cap once cut this chain short
    description: '🔴 a transient code ten causes deep is transient',
    given: {
      error: Array.from({ length: 10 }).reduce<Error>(
        (cause, _, index) =>
          Object.assign(new Error(`wrap ${index}`), { cause }),
        Object.assign(new Error('reset'), { code: 'ECONNRESET' }),
      ),
    },
    expect: { output: true },
  },
  {
    description: 'a cause that loops back on itself ends, and is not transient',
    given: {
      error: (() => {
        const looped = new Error('looped');
        Object.assign(looped, { cause: looped });
        return looped;
      })(),
    },
    expect: { output: false },
  },
];

describe('isErrorOfTransientBrainFault', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(isErrorOfTransientBrainFault(thisCase.given)).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
