import { isErrorOfDenial } from './isErrorOfDenial';

/**
 * .what = data-driven cases for isErrorOfDenial across fs error shapes
 * .why = the denial allowlist is the exact complement of the absence one: two codes
 *        mean "there, and barred"; an absence code or a codeless throw must never
 *        read as a denial, or a defect surfaces as a polite refusal
 */
const CASES: {
  description: string;
  error: unknown;
  expected: boolean;
}[] = [
  {
    description: 'an EACCES rejection → denial',
    error: Object.assign(new Error('denied'), { code: 'EACCES' }),
    expected: true,
  },
  {
    description: 'an EPERM rejection → denial',
    error: { code: 'EPERM' },
    expected: true,
  },
  {
    description: 'an ENOENT rejection → not a denial (an absence)',
    error: { code: 'ENOENT' },
    expected: false,
  },
  {
    description: 'an ENOTDIR rejection → not a denial (an absence)',
    error: { code: 'ENOTDIR' },
    expected: false,
  },
  {
    description: 'a throw with no code → not a denial',
    error: new TypeError('boom'),
    expected: false,
  },
];

describe('isErrorOfDenial', () => {
  CASES.forEach((thisCase) =>
    test(thisCase.description, () => {
      expect(isErrorOfDenial({ error: thisCase.error })).toEqual(
        thisCase.expected,
      );
    }),
  );
});
