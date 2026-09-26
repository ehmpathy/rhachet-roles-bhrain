import { asStrictPositiveInteger } from './asStrictPositiveInteger';

/**
 * .what = unit cases for the shared strict-positive-integer gate
 * .why = this pure transformer owns the "all-digits, edge-to-edge, > 0" parse three numeric
 *        boundaries share (interval, say-timeout, pid handle). its whole point is to REJECT the
 *        lenient-parseInt slips (`123abc`, `12 34`, negatives, zero), so those are the cases.
 */
const CASES: {
  description: string;
  raw: string;
  expected: number | null;
}[] = [
  {
    description: 'a plain positive integer',
    raw: '1200000',
    expected: 1200000,
  },
  { description: 'a small positive integer', raw: '1', expected: 1 },
  {
    description: 'flanking whitespace is trimmed',
    raw: '  42  ',
    expected: 42,
  },
  { description: 'zero is not positive', raw: '0', expected: null },
  { description: 'a negative is rejected', raw: '-5', expected: null },
  {
    description: 'a numeric prefix with junk suffix (parseInt trap)',
    raw: '1200000abc',
    expected: null,
  },
  {
    description: 'an internal space (torn write)',
    raw: '12 34',
    expected: null,
  },
  { description: 'a non-numeric string', raw: 'abc', expected: null },
  { description: 'an empty string', raw: '', expected: null },
  { description: 'a decimal is not an integer', raw: '3.5', expected: null },
];

describe('asStrictPositiveInteger', () => {
  CASES.forEach((thisCase) => {
    test(thisCase.description, () => {
      expect(asStrictPositiveInteger({ raw: thisCase.raw })).toEqual(
        thisCase.expected,
      );
    });
  });
});
