import { given, then, when } from 'test-fns';

import type { RouteGuardPartitionAction } from './asRouteGuardPartitionAction';
import { asRouteGuardPartitionDeclarationsOfAction } from './asRouteGuardPartitionDeclarationsOfAction';

/**
 * .what = the declarations each action kind carries into the parse check
 * .why = a kind that drops its declarations skips the parse, so a malformed set would
 *        reach the write unread; each kind is a case
 */
const TEST_CASES: Array<{
  description: string;
  given: { action: RouteGuardPartitionAction | null };
  expect: { output: string[] };
}> = [
  {
    description: 'a declare carries its whole set',
    given: {
      action: {
        kind: 'declare',
        partition: ['api=src/api/**', 'ui=src/ui/**'],
      },
    },
    expect: { output: ['api=src/api/**', 'ui=src/ui/**'] },
  },
  {
    description: 'a clear carries the flags beside its sentinel',
    given: { action: { kind: 'clear', others: ['api=src/api/**'] } },
    expect: { output: ['api=src/api/**'] },
  },
  {
    description: 'a bare clear carries none',
    given: { action: { kind: 'clear', others: [] } },
    expect: { output: [] },
  },
  {
    description: 'a claim carries none',
    given: {
      action: { kind: 'claim', claims: [{ glob: 'src/new/**', into: 'api' }] },
    },
    expect: { output: [] },
  },
  {
    description: 'a show (no action) carries none',
    given: { action: null },
    expect: { output: [] },
  },
];

describe('asRouteGuardPartitionDeclarationsOfAction', () => {
  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      when('[t0] its declarations are read', () => {
        then('they match the kind', () => {
          expect(
            asRouteGuardPartitionDeclarationsOfAction({
              action: thisCase.given.action,
            }),
          ).toEqual(thisCase.expect.output);
        });
      });
    }),
  );
});
