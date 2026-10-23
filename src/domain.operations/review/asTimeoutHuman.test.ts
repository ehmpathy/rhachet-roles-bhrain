import { given, then } from 'test-fns';

import { asTimeoutHuman } from './asTimeoutHuman';

const TEST_CASES = [
  { ms: 21 * 60_000, expected: '21 minutes' },
  { ms: 60_000, expected: '1 minute' },
  { ms: 90_000, expected: '90 seconds' },
  { ms: 1000, expected: '1 second' },
  { ms: 4500, expected: '4500ms' },
  { ms: 1, expected: '1ms' },
] as const;

describe('asTimeoutHuman', () => {
  given('[case1] a timeout bound', () => {
    TEST_CASES.map((thisCase) =>
      then(`${thisCase.ms}ms renders as '${thisCase.expected}'`, () => {
        expect(asTimeoutHuman({ ms: thisCase.ms })).toEqual(thisCase.expected);
      }),
    );
  });
});
