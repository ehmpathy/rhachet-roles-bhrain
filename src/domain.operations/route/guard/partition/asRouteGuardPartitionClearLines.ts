import { asCountedNoun } from '@src/utils/asCountedNoun';

import { asRouteGuardPartitionShellLines } from './asRouteGuardPartitionShellLines';
import type { RouteGuardPartitionScope } from './RouteGuardPartitionScope';

/**
 * .what = the stdout tree of a `route.guard.partition --partition none` — a scope cleared
 * .why = a clear has no split to show, so it states what it removes and what the scope's
 *        reviewers read once it is gone (fulcrum F105)
 */
export const asRouteGuardPartitionClearLines = (input: {
  mode: 'plan' | 'apply';
  route: string;
  scope: RouteGuardPartitionScope;
  /** the partitions the scope held before; null where it held none */
  replaced: string[] | null;
}): string[] => {
  // what the clear removes
  const clearsLine =
    input.replaced === null
      ? '   ├─ clears: none held'
      : `   ├─ clears: ${asCountedNoun({ count: input.replaced.length, one: 'partition', many: 'partitions' })}`;

  // what the scope's reviewers read after it
  const afterLine =
    input.scope.kind === 'all'
      ? '   ├─ after: reviewers with no override run whole'
      : '   ├─ after: this reviewer reads @all';

  return asRouteGuardPartitionShellLines({
    mode: input.mode,
    route: input.route,
    scope: input.scope,
    headlineApplied: 'partitions cleared',
    peerNote: null,
    body: [clearsLine, afterLine],
  });
};
