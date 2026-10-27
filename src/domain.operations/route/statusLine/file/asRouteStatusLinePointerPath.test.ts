import { given, then, when } from 'test-fns';

import { asRouteStatusLinePointerPath } from './asRouteStatusLinePointerPath';

const DIR =
  '/repo/.agent/.cache/repo=bhrain/role=driver/skill=route.status.line';

const TEST_CASES: {
  description: string;
  given: { cwd: string; branch: string };
  expect: { path: string };
}[] = [
  {
    description: 'a slashed branch: flattened, beside the node record',
    given: { cwd: '/repo', branch: 'feat/my-feature' },
    expect: { path: `${DIR}/branch=feat.my-feature.route` },
  },
  {
    description:
      'a branch with unsafe chars: the same flat rule the cache uses',
    given: { cwd: '/repo', branch: 'a b@c' },
    expect: { path: `${DIR}/branch=a-b-c.route` },
  },
];

describe('asRouteStatusLinePointerPath', () => {
  TEST_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the path is computed', () => {
        then('it names `branch=<flat>.route` in the cache dir', () => {
          expect(asRouteStatusLinePointerPath(thisCase.given)).toEqual(
            thisCase.expect.path,
          );
        });
      });
    }),
  );
});
