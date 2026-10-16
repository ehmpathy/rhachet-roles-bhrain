import { getOneCharCountOfUtf8Bytes } from '@src/domain.operations/review/meter/getOneCharCountOfUtf8Bytes';

const TEST_CASES = [
  { description: 'counts no chars in no bytes', text: '', expected: 0 },
  { description: 'counts one char per ascii byte', text: 'abc', expected: 3 },
  {
    description: 'counts a two-byte glyph as one char',
    text: 'café',
    expected: 4,
  },
  {
    description: 'counts a three-byte glyph as one char',
    text: '—',
    expected: 1,
  },
  {
    description: 'counts a four-byte glyph as two chars, as a js string does',
    text: 'a🦉b',
    expected: 4,
  },
];

describe('getOneCharCountOfUtf8Bytes', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const bytes = Buffer.from(thisCase.text, 'utf-8');
      expect(getOneCharCountOfUtf8Bytes({ bytes })).toEqual(thisCase.expected);
      expect(getOneCharCountOfUtf8Bytes({ bytes })).toEqual(
        thisCase.text.length,
      );
    }),
  );

  test('counts the lead byte of a glyph the run cuts short', () => {
    const bytes = Buffer.from('a—', 'utf-8').subarray(0, 2);
    expect(getOneCharCountOfUtf8Bytes({ bytes })).toEqual(2);
  });
});
