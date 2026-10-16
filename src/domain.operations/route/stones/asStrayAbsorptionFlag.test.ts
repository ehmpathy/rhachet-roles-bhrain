import { given, then, when } from 'test-fns';

import { asStrayAbsorptionFlag } from './asStrayAbsorptionFlag';

const TEST_CASES = [
  {
    description: 'no stance-only flag',
    given: {},
    expect: { output: null },
  },
  {
    description: '--with alone',
    given: { with: 'architect' },
    expect: { output: '--with' },
  },
  {
    description: '--about alone',
    given: { about: 'blocker.1' },
    expect: { output: '--about' },
  },
  {
    description: '--why alone',
    given: { why: '.fulcrums/F1.md' },
    expect: { output: '--why' },
  },
  {
    description: '--severity alone',
    given: { severity: 'better' },
    expect: { output: '--severity' },
  },
  {
    description: 'several flags, cites the first in order',
    given: { why: '.fulcrums/F1.md', about: 'blocker.1' },
    expect: { output: '--about' },
  },
];

describe('asStrayAbsorptionFlag', () => {
  given('[case1] the stance-only flags a caller passed', () => {
    TEST_CASES.map((thisCase) =>
      when(`[t0] ${thisCase.description}`, () => {
        then(`it names ${String(thisCase.expect.output)}`, () => {
          expect(asStrayAbsorptionFlag(thisCase.given)).toEqual(
            thisCase.expect.output,
          );
        });
      }),
    );
  });
});
