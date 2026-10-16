import { asRouteGuardPartitionScopeLabel } from './asRouteGuardPartitionScopeLabel';
import type { RouteGuardPartitionScope } from './RouteGuardPartitionScope';

const TEST_CASES: Array<{
  description: string;
  given: RouteGuardPartitionScope;
  expect: string;
}> = [
  {
    description: 'the @all scope reads as @all',
    given: { kind: 'all' },
    expect: '@all',
  },
  {
    description: 'a one-reviewer scope reads as its peer on its stone',
    given: { kind: 'peer', peer: 'r2', stone: '5.1.execution' },
    expect: 'r2 on 5.1.execution',
  },
];

describe('asRouteGuardPartitionScopeLabel', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(
        asRouteGuardPartitionScopeLabel({ scope: thisCase.given }),
      ).toEqual(thisCase.expect);
    }),
  );
});
