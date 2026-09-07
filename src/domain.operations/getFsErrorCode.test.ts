import { getFsErrorCode } from './getFsErrorCode';

/**
 * .what = data-driven cases for getFsErrorCode across error shapes
 * .why = the guard must read a code off a native fs rejection without instanceof (vm-realm
 *        safe) and return null for any shapeless value — these cases pin both halves
 */
const CASES: {
  description: string;
  error: unknown;
  expected: string | null;
}[] = [
  {
    description: 'an EEXIST-shaped rejection → EEXIST',
    error: Object.assign(new Error('exists'), { code: 'EEXIST' }),
    expected: 'EEXIST',
  },
  {
    description: 'an ENOENT-shaped rejection → ENOENT',
    error: { code: 'ENOENT' },
    expected: 'ENOENT',
  },
  {
    description: 'a plain Error with no code → null',
    error: new Error('boom'),
    expected: null,
  },
  {
    description: 'null → null',
    error: null,
    expected: null,
  },
  {
    description: 'a string → null',
    error: 'ENOENT',
    expected: null,
  },
  {
    description: 'a non-string code → null',
    error: { code: 123 },
    expected: null,
  },
];

describe('getFsErrorCode', () => {
  CASES.forEach((thisCase) =>
    test(thisCase.description, () => {
      expect(getFsErrorCode(thisCase.error)).toEqual(thisCase.expected);
    }),
  );
});
