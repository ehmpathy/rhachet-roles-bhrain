import { isPathInside } from './isPathInside';

const TEST_CASES = [
  {
    description: 'a file within the dir is inside',
    given: { dir: 'briefs', path: 'briefs/rule.x.md' },
    expect: true,
  },
  {
    description: 'the dir itself is inside',
    given: { dir: 'briefs', path: 'briefs' },
    expect: true,
  },
  {
    description: 'a name whose first chars are two dots stays inside',
    given: { dir: 'briefs', path: 'briefs/..notes.md' },
    expect: true,
  },
  {
    description: 'a peer dir of the dir is outside',
    given: { dir: 'briefs', path: 'skills/x.sh' },
    expect: false,
  },
  {
    description: 'a path that climbs out of the dir is outside',
    given: { dir: 'briefs', path: 'briefs/../../etc/passwd' },
    expect: false,
  },
];

describe('isPathInside', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(isPathInside(thisCase.given)).toEqual(thisCase.expect);
    }),
  );
});
