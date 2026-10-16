import { asPathRelativeToCwd } from './asPathRelativeToCwd';

const TEST_CASES = [
  {
    description: 'casts an absolute path within the cwd to its relative form',
    given: { path: '/repo/.behavior/v1.route', cwd: '/repo' },
    expect: { output: '.behavior/v1.route' },
  },
  {
    description: 'keeps a relative path as given',
    given: { path: '.behavior/v1.route', cwd: '/repo' },
    expect: { output: '.behavior/v1.route' },
  },
  {
    description: 'normalizes a dot-led relative path',
    given: { path: './.behavior/v1.route/', cwd: '/repo' },
    expect: { output: '.behavior/v1.route' },
  },
];

describe('asPathRelativeToCwd', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asPathRelativeToCwd(thisCase.given)).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
