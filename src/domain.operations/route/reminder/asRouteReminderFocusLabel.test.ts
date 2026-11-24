import { asRouteReminderFocusLabel } from './asRouteReminderFocusLabel';

const REPO_ROOT = '/home/human/repo';

const TEST_CASES = [
  {
    description: 'a route inside the repo renders relative to the repo root',
    given: { route: '/home/human/repo/.behavior/v2026_11_21.feat' },
    expect: { label: '.behavior/v2026_11_21.feat' },
  },
  {
    description: 'a route that is the repo root renders as dot, never empty',
    given: { route: '/home/human/repo' },
    expect: { label: '.' },
  },
  {
    description: 'a route outside the repo keeps its absolute path',
    given: { route: '/tmp/route-abc' },
    expect: { label: '/tmp/route-abc' },
  },
  {
    description:
      'a peer dir whose name shares the repo prefix is outside, so it stays absolute',
    given: { route: '/home/human/repo2/.behavior/x' },
    expect: { label: '/home/human/repo2/.behavior/x' },
  },
];

describe('asRouteReminderFocusLabel', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(
        asRouteReminderFocusLabel({
          repoRoot: REPO_ROOT,
          route: thisCase.given.route,
        }),
      ).toEqual(thisCase.expect.label);
    }),
  );
});
