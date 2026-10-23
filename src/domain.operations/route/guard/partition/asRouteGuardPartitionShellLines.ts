import { asRouteGuardPartitionHeadLines } from './asRouteGuardPartitionHeadLines';
import type { RouteGuardPartitionScope } from './RouteGuardPartitionScope';

/**
 * .what = the shared `🗿 route.guard.partition` tree shell — header, route, peer, footer —
 *         around a body each declaration kind supplies
 * .why = a declare and a clear differ only in their middle block. one shell keeps the header
 *        phrase, the `@all` render, and the plan/apply footer in one place, so the two kinds
 *        cannot drift (rule.forbid.duplicate-format-tree-operations)
 */
export const asRouteGuardPartitionShellLines = (input: {
  mode: 'plan' | 'apply';
  route: string;
  scope: RouteGuardPartitionScope;
  /** the owl headline once applied, e.g. `partitions declared` */
  headlineApplied: string;
  /** a note after a peer scope's line, e.g. `(overrides @all)`; null for none */
  peerNote: string | null;
  /** the kind-specific rows, each already prefixed with `   ├─` or `   │` */
  body: string[];
}): string[] => {
  return [
    input.mode === 'plan'
      ? '🦉 partitions previewed — naught written'
      : `🦉 ${input.headlineApplied}`,
    '',
    ...asRouteGuardPartitionHeadLines({
      route: input.route,
      scope: input.scope,
      mode: input.mode,
      peerNote: input.peerNote,
    }),
    ...input.body,
    input.mode === 'plan'
      ? '   └─ to write it: add --mode apply'
      : '   └─ every peer review in scope reads it on its next run',
  ];
};
