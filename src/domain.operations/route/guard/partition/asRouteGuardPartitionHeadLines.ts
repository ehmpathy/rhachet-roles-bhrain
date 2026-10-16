import { asRouteGuardPartitionScopeLabel } from './asRouteGuardPartitionScopeLabel';
import type { RouteGuardPartitionScope } from './RouteGuardPartitionScope';

/**
 * .what = the `🗿 route.guard.partition` head — the operation title, the route, and whom the
 *         scope reaches
 * .why = every partition render (declare, clear, show, coverage) opens with these lines. one
 *        operation owns the title phrase and the `@all` render, so no render can drift from
 *        the rest (rule.forbid.duplicate-format-tree-operations)
 */
export const asRouteGuardPartitionHeadLines = (input: {
  route: string;
  /**
   * the scope the render declares; null for a coverage read of a stone, which reads every
   * scope its reviewers read and so names no single one in its head
   */
  scope: RouteGuardPartitionScope | null;
  /**
   * the `--mode` the caller typed, which the title echoes as the flag itself
   * (`--mode plan`, `--mode apply`), as `route.guard.upgrade` does; null for a read, which
   * takes no mode
   */
  mode: 'plan' | 'apply' | null;
  /** a note after a peer scope's line, e.g. `(overrides @all)`; null for none */
  peerNote: string | null;
}): string[] => {
  const title = `🗿 route.guard.partition${input.mode === null ? '' : ` --mode ${input.mode}`}`;
  const routeLine = `   ├─ route = ${input.route}`;

  // a head with no scope names none
  const scope = input.scope;
  if (scope === null) return [title, routeLine];

  // whom the declaration reaches
  const label = asRouteGuardPartitionScopeLabel({ scope });
  const note =
    scope.kind === 'all' ? '(every reviewer, every stone)' : input.peerNote;
  const peerLine = `   ├─ peer = ${label}${note === null ? '' : ` ${note}`}`;
  return [title, routeLine, peerLine];
};
