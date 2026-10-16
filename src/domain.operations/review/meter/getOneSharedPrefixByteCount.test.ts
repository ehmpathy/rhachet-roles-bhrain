import { getOneSharedPrefixByteCount } from '@src/domain.operations/review/meter/getOneSharedPrefixByteCount';

const TEST_CASES = [
  {
    description: 'two equal texts share every byte',
    a: 'rules then targets',
    b: 'rules then targets',
    expected: 18,
  },
  {
    description: 'two texts part at the first byte that differs',
    a: 'rules then targets',
    b: 'rules then diffs',
    expected: 11,
  },
  {
    description: 'a text shares its whole length with a text it leads',
    a: 'rules',
    b: 'rules then targets',
    expected: 5,
  },
  {
    description: 'two texts that differ at byte zero share none',
    a: 'rules',
    b: 'targets',
    expected: 0,
  },
  {
    description: 'a multibyte glyph parts at its first divergent byte',
    a: 'a—',
    b: 'a–',
    expected: 3,
  },
];

describe('getOneSharedPrefixByteCount', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(
        getOneSharedPrefixByteCount({ a: thisCase.a, b: thisCase.b }),
      ).toEqual(thisCase.expected);
    }),
  );

  TEST_CASES.map((thisCase) =>
    test(`${thisCase.description}, when handed as bytes`, () => {
      expect(
        getOneSharedPrefixByteCount({
          a: Buffer.from(thisCase.a, 'utf-8'),
          b: Buffer.from(thisCase.b, 'utf-8'),
        }),
      ).toEqual(thisCase.expected);
    }),
  );
});
