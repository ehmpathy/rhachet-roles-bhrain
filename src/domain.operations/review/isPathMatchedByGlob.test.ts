import { isPathMatchedByGlob } from './isPathMatchedByGlob';

/**
 * .what = unit cases for isPathMatchedByGlob
 * .why = locks the --paths-wout match semantics: exact, suffix, wildcard
 */
const TEST_CASES = [
  {
    description: 'exact path match returns true',
    given: { path: 'src/foo.ts', glob: 'src/foo.ts' },
    expect: true,
  },
  {
    description: 'suffix segment match returns true',
    given: { path: 'src/nested/secret.ts', glob: 'secret.ts' },
    expect: true,
  },
  {
    description: 'partial segment (not a full segment) returns false',
    given: { path: 'src/mysecret.ts', glob: 'secret.ts' },
    expect: false,
  },
  {
    description: 'wildcard star matches across segments',
    given: { path: 'src/a/b/qux.test.ts', glob: '*.test.ts' },
    expect: true,
  },
  {
    description: 'wildcard star excludes non-matches',
    given: { path: 'src/a/b/qux.ts', glob: '*.test.ts' },
    expect: false,
  },
  {
    description: 'question mark matches a single char',
    given: { path: 'src/a1.ts', glob: 'src/a?.ts' },
    expect: true,
  },
  {
    description: 'no wildcard, no exact, no suffix returns false',
    given: { path: 'src/foo.ts', glob: 'bar.ts' },
    expect: false,
  },
] as const;

describe('isPathMatchedByGlob', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const output = isPathMatchedByGlob({
        path: thisCase.given.path,
        glob: thisCase.given.glob,
      });
      expect(output).toEqual(thisCase.expect);
    }),
  );
});
