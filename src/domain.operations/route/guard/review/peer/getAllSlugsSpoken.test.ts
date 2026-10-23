import { getAllSlugsSpoken } from './getAllSlugsSpoken';

const TEST_CASES = [
  {
    description: 'no givens means no slugs',
    given: { givens: [] },
    expect: { output: [] },
  },
  {
    description: 'dedupes a slug that spoke twice',
    given: { givens: [{ slug: 'lint' }, { slug: 'lint' }] },
    expect: { output: ['lint'] },
  },
  {
    description: 'sorts in code-unit order, whatever the input order',
    given: {
      givens: [
        { slug: 'mech-b' },
        { slug: 'arch-a' },
        { slug: 'Zeta' },
        { slug: 'mech-b' },
      ],
    },
    expect: { output: ['Zeta', 'arch-a', 'mech-b'] },
  },
];

describe('getAllSlugsSpoken', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(getAllSlugsSpoken(thisCase.given)).toEqual(thisCase.expect.output);
    }),
  );
});
