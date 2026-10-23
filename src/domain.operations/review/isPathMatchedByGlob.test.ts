import { isPathMatchedByGlob } from './isPathMatchedByGlob';

/**
 * .what = unit cases for isPathMatchedByGlob
 * .why = locks the match semantics --paths-wout, the polluter exemption, and --partition
 *        share: exact, suffix, wildcard with `*` held to one segment
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
    description: 'a slash-free wildcard tests the basename, at any depth',
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
  {
    description:
      '🔴 a brace list of extensions matches any member — as --paths-with reads it',
    given: { path: 'src/a/x.md', glob: '**/*.{ts,md}' },
    expect: true,
  },
  {
    description: 'a brace list of extensions rejects a non-member',
    given: { path: 'src/a/x.snap', glob: '**/*.{ts,md}' },
    expect: false,
  },
  {
    description: '🔴 a brace list of dirs matches a path under any member',
    given: { path: 'src/b/deep/x.ts', glob: 'src/{a,b}/**' },
    expect: true,
  },
  {
    description: 'a brace list of dirs rejects a path under a non-member',
    given: { path: 'src/c/x.ts', glob: 'src/{a,b}/**' },
    expect: false,
  },
  {
    description: '🔴 a single star stays within one segment',
    given: { path: 'src/review/meter/x.ts', glob: 'src/review/*' },
    expect: false,
  },
  {
    description: 'a single star matches a file directly in its segment',
    given: { path: 'src/review/x.ts', glob: 'src/review/*' },
    expect: true,
  },
  {
    description: '🔴 a dot in a glob is literal, never any char',
    given: { path: 'blackbox/reviewXcost.test.ts', glob: 'blackbox/review.*' },
    expect: false,
  },
  {
    description: 'a dot in a glob matches a literal dot',
    given: { path: 'blackbox/review.cost.test.ts', glob: 'blackbox/review.*' },
    expect: true,
  },
  {
    description: 'a double star prefix matches zero directories',
    given: { path: 'x.test.ts', glob: '**/*.test.ts' },
    expect: true,
  },
  {
    description:
      '🔴 a class matches one char of its members — as --paths-with reads it',
    given: { path: 'src/b/x.ts', glob: 'src/[ab]/*.ts' },
    expect: true,
  },
  {
    description: '🔴 a negated class matches a char outside its members',
    given: { path: 'src/c/x.ts', glob: 'src/[!ab]/*.ts' },
    expect: true,
  },
  {
    description: 'a negated class rejects its members',
    given: { path: 'src/a/x.ts', glob: 'src/[!ab]/*.ts' },
    expect: false,
  },
  {
    description: 'a bracketed literal name still matches itself',
    given: { path: 'briefs/howto.[guide].md', glob: 'briefs/howto.[guide].md' },
    expect: true,
  },
  {
    description: 'a question mark never matches a slash',
    given: { path: 'src/a/.ts', glob: 'src/a?.ts' },
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
