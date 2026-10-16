import type { RouteGuardPartitionScope } from './RouteGuardPartitionScope';

/**
 * .what = how a partition scope reads in a render — `@all`, or `<peer> on <stone>`
 * .why = the head, the coverage read, and the gap refusal each name a scope; one transformer
 *        owns the label, so no render can drift from the rest
 *        (rule.forbid.duplicate-format-tree-operations)
 */
export const asRouteGuardPartitionScopeLabel = (input: {
  scope: RouteGuardPartitionScope;
}): string =>
  input.scope.kind === 'all'
    ? '@all'
    : `${input.scope.peer} on ${input.scope.stone}`;
