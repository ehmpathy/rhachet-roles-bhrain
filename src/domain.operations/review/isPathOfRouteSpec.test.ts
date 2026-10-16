import { isPathOfRouteSpec } from './isPathOfRouteSpec';

const ROUTE = '.behavior/v2026_10_04.feat';

const TEST_CASES = [
  {
    description: 'a file inside the route is its spec',
    given: { path: `${ROUTE}/1.vision.md`, route: ROUTE },
    expect: true,
  },
  {
    description: 'the route dir itself is its spec',
    given: { path: ROUTE, route: ROUTE },
    expect: true,
  },
  {
    description:
      '🔴 a peer dir that merely shares the prefix is not the spec — the slash is the bound',
    given: { path: `${ROUTE}-other/1.vision.md`, route: ROUTE },
    expect: false,
  },
  {
    description: 'a source file is not the spec',
    given: { path: 'src/a.ts', route: ROUTE },
    expect: false,
  },
  {
    description: 'a review outside a route has no spec',
    given: { path: `${ROUTE}/1.vision.md`, route: null },
    expect: false,
  },
] as const;

describe('isPathOfRouteSpec', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(isPathOfRouteSpec(thisCase.given)).toEqual(thisCase.expect);
    }),
  );
});
