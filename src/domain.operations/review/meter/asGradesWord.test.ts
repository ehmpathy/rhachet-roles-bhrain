import { asGradesWord } from './asGradesWord';

const TEST_CASES: {
  description: string;
  given: { census: { metered: number; refused: number; unknown: number } };
  expect: { phrase: string };
}[] = [
  {
    description: '🔴 a zero bucket is stated, never dropped',
    given: { census: { metered: 2, refused: 0, unknown: 0 } },
    expect: { phrase: '2 metered · 0 refused · 0 unknown' },
  },
  {
    description: 'a zero metered count is stated too — the sharpest fact',
    given: { census: { metered: 0, refused: 0, unknown: 1 } },
    expect: { phrase: '0 metered · 0 refused · 1 unknown 🟡' },
  },
  {
    description: 'an unknown run flags the totals as a floor',
    given: { census: { metered: 3, refused: 1, unknown: 2 } },
    expect: { phrase: '3 metered · 1 refused · 2 unknown 🟡' },
  },
];

describe('asGradesWord', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asGradesWord(thisCase.given)).toEqual(thisCase.expect.phrase);
    }),
  );
});
