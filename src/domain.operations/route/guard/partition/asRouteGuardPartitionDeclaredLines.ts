import { asRouteGuardPartitionHeadLines } from './asRouteGuardPartitionHeadLines';
import type { RouteGuardPartitionScope } from './RouteGuardPartitionScope';

/**
 * .what = the stdout tree of a bare `route.guard.partition` — what one scope declares now
 * .why = with no `--partition`, the verb shows the scope's set; the render is named so the
 *        cli reads its three branches (show, clear, declare) alike
 */
export const asRouteGuardPartitionDeclaredLines = (input: {
  route: string;
  scope: RouteGuardPartitionScope;
  /** the partitions the scope holds; null where it holds none */
  declared: string[] | null;
}): string[] => {
  // the shared head every partition render opens with
  const head = [
    '',
    ...asRouteGuardPartitionHeadLines({
      route: input.route,
      scope: input.scope,
      mode: null,
      peerNote: null,
    }),
  ];

  // a scope that holds none says so on one line
  const declared = input.declared;
  if (!declared) return [...head, '   └─ declared: none', ''];

  // each declared partition, the last one closes the branch
  const rows = declared.map(
    (value, index) =>
      `      ${index === declared.length - 1 ? '└─' : '├─'} ${value}`,
  );
  return [...head, '   └─ declared', ...rows, ''];
};
