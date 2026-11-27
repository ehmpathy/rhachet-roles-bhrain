import { getOneSlugNearest } from './getOneSlugNearest';

const TEST_CASES: Array<{
  description: string;
  given: { slug: string; candidates: string[] };
  expect: string | null;
}> = [
  {
    description: 'names the role one swap away',
    given: {
      slug: 'mechanik',
      candidates: ['architect', 'mechanic', 'debunker'],
    },
    expect: 'mechanic',
  },
  {
    description: 'names the role one char short',
    given: { slug: 'mechani', candidates: ['architect', 'mechanic'] },
    expect: 'mechanic',
  },
  {
    description: 'names none when no role is near',
    given: { slug: 'ghost', candidates: ['architect', 'mechanic'] },
    expect: null,
  },
  {
    description: 'names none when no roles exist',
    given: { slug: 'mechanic', candidates: [] },
    expect: null,
  },
];

describe('getOneSlugNearest', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(getOneSlugNearest(thisCase.given)).toEqual(thisCase.expect);
    }),
  );
});
