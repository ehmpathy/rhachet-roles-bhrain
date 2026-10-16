import { asPrefixBreak } from '@src/domain.operations/review/meter/asPrefixBreak';

const TEST_CASES = [
  {
    description: 'a prefix that parts before the head ends breaks in the head',
    given: {
      shared: { bytes: 800, chars: 800, laterBytes: 5_000 },
      headChars: 1_000,
    },
    expected: 'head',
  },
  {
    description: 'a prefix that parts past the head breaks in the tail',
    given: {
      shared: { bytes: 3_000, chars: 3_000, laterBytes: 5_000 },
      headChars: 1_000,
    },
    expected: 'tail',
  },
  {
    description: 'a prefix that ends exactly at the head breaks in the tail',
    given: {
      shared: { bytes: 1_000, chars: 1_000, laterBytes: 5_000 },
      headChars: 1_000,
    },
    expected: 'tail',
  },
  {
    description: 'a later prompt that matched whole breaks nowhere',
    given: {
      shared: { bytes: 5_000, chars: 5_000, laterBytes: 5_000 },
      headChars: 1_000,
    },
    expected: 'whole',
  },
  {
    description: 'a head not on record leaves the side unknown',
    given: {
      shared: { bytes: 3_000, chars: 3_000, laterBytes: 5_000 },
      headChars: null,
    },
    expected: null,
  },
  {
    description: 'a prefix that was never measured breaks nowhere known',
    given: { shared: null, headChars: 1_000 },
    expected: null,
  },
];

describe('asPrefixBreak', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asPrefixBreak(thisCase.given)).toEqual(thisCase.expected);
    }),
  );
});
