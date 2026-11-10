import { given, then, when } from 'test-fns';

import { asRouteStatusLineCachePath } from './asRouteStatusLineCachePath';

/**
 * .what = unit tests for the status line cache path
 * .why = the reader, the writer, and the bind ops that drop the cache must all name one file per
 *        branch, under the gitignored `.agent/.cache/`
 */
const TEST_CASES: {
  description: string;
  given: { cwd: string; branch: string };
  expected: string;
}[] = [
  {
    description: 'a flat branch names its own file under .agent/.cache',
    given: { cwd: '/repo', branch: 'main' },
    expected:
      '/repo/.agent/.cache/repo=bhrain/role=driver/skill=route.status.line/branch=main.json',
  },
  {
    description: 'a slash branch is flattened, so it never makes a subdir',
    given: { cwd: '/repo', branch: 'human/fix-status-line' },
    expected:
      '/repo/.agent/.cache/repo=bhrain/role=driver/skill=route.status.line/branch=human.fix-status-line.json',
  },
];

describe('asRouteStatusLineCachePath', () => {
  TEST_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the cache path is computed', () => {
        then('it names the expected file', () => {
          expect(asRouteStatusLineCachePath(thisCase.given)).toEqual(
            thisCase.expected,
          );
        });
      });
    }),
  );
});
