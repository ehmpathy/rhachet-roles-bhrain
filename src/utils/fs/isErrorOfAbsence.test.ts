import { isErrorOfAbsence } from './isErrorOfAbsence';

/**
 * .what = data-driven cases for isErrorOfAbsence across fs error shapes
 * .why = the absence allowlist is the exact complement of the denial one: two codes
 *        mean "not there"; a denial code, a codeless throw, or an inherited code must
 *        never read as an absence, or a defect renders as a measured nil
 */
const CASES: {
  description: string;
  error: unknown;
  expected: boolean;
}[] = [
  {
    description: 'an ENOENT rejection → absence',
    error: Object.assign(new Error('absent'), { code: 'ENOENT' }),
    expected: true,
  },
  {
    description: 'an ENOTDIR rejection → absence',
    error: { code: 'ENOTDIR' },
    expected: true,
  },
  {
    description: 'an EACCES rejection → not an absence (a denial)',
    error: { code: 'EACCES' },
    expected: false,
  },
  {
    description: 'an EPERM rejection → not an absence (a denial)',
    error: { code: 'EPERM' },
    expected: false,
  },
  {
    description: 'a throw with no code → not an absence',
    error: new TypeError('boom'),
    expected: false,
  },
  {
    description: 'a code inherited off a prototype → not an absence',
    error: Object.create({ code: 'ENOENT' }),
    expected: false,
  },
  {
    description: 'a null throw → not an absence',
    error: null,
    expected: false,
  },
];

describe('isErrorOfAbsence', () => {
  CASES.forEach((thisCase) =>
    test(thisCase.description, () => {
      expect(isErrorOfAbsence({ error: thisCase.error })).toEqual(
        thisCase.expected,
      );
    }),
  );
});
