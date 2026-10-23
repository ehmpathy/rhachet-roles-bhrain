import { given, then, when } from 'test-fns';

import { isLaterByIterationThenPath } from './isLaterByIterationThenPath';

const TEST_CASES = [
  {
    description: 'no incumbent',
    given: {
      candidate: { iteration: 1, path: 'a.md' },
      incumbent: null,
    },
    expect: { output: true },
  },
  {
    description: 'a higher iteration',
    given: {
      candidate: { iteration: 3, path: 'a.md' },
      incumbent: { iteration: 2, path: 'z.md' },
    },
    expect: { output: true },
  },
  {
    description: 'a lower iteration',
    given: {
      candidate: { iteration: 1, path: 'z.md' },
      incumbent: { iteration: 2, path: 'a.md' },
    },
    expect: { output: false },
  },
  {
    description: 'a tie on iteration, with a later path',
    given: {
      candidate: { iteration: 2, path: 'b.md' },
      incumbent: { iteration: 2, path: 'a.md' },
    },
    expect: { output: true },
  },
  {
    description: 'a tie on iteration, with an earlier path',
    given: {
      candidate: { iteration: 2, path: 'a.md' },
      incumbent: { iteration: 2, path: 'b.md' },
    },
    expect: { output: false },
  },
  {
    description: 'the same artifact twice',
    given: {
      candidate: { iteration: 2, path: 'a.md' },
      incumbent: { iteration: 2, path: 'a.md' },
    },
    expect: { output: false },
  },
];

describe('isLaterByIterationThenPath', () => {
  given('[case1] a candidate and an incumbent', () => {
    TEST_CASES.map((thisCase) =>
      when(`[t0] ${thisCase.description}`, () => {
        then(`it returns ${String(thisCase.expect.output)}`, () => {
          expect(isLaterByIterationThenPath(thisCase.given)).toEqual(
            thisCase.expect.output,
          );
        });
      }),
    );
  });
});
