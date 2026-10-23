import type { RouteGuardPartitionAction } from './asRouteGuardPartitionAction';

/**
 * .what = the `--partition` declarations an action carries, which must each parse
 * .why = a declare carries its whole set, and a clear carries the flags beside its
 *        sentinel; both must parse before any read, so the fault can print the
 *        corrected declaration. a claim or a show carries none. named so the contract
 *        reads one call rather than a nested branch over the action kind
 *        (rule.forbid.decode-friction-in-orchestrators)
 */
export const asRouteGuardPartitionDeclarationsOfAction = (input: {
  action: RouteGuardPartitionAction | null;
}): string[] => {
  // a declare carries its whole set
  if (input.action?.kind === 'declare') return input.action.partition;

  // a clear carries the flags beside its sentinel
  if (input.action?.kind === 'clear') return input.action.others;

  // a claim, a prune, or a show carries no declaration
  return [];
};
