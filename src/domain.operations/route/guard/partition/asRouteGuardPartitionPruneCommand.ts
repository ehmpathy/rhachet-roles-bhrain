import { asRouteGuardPartitionCommand } from './asRouteGuardPartitionCommand';
import type { RouteGuardPartitionScope } from './RouteGuardPartitionScope';

/**
 * .what = the one-line `route.guard.partition --prune` command that drops a list of globs
 *         from every held partition that lists them
 * .why = a stale glob — its file moved or merged away — is flagged on every plan, and its cure
 *        must cost one paste, never a re-declaration of the whole set
 *        (rule.require.errors-name-the-fix)
 * .note = each glob once, in first-seen order, since one glob may sit in several partitions
 */
export const asRouteGuardPartitionPruneCommand = (input: {
  route: string | null;
  scope: RouteGuardPartitionScope;
  globs: string[];
}): string => {
  const command = asRouteGuardPartitionCommand({
    route: input.route,
    scope: input.scope,
  });
  const globsUnique = input.globs.filter(
    (glob, index) => input.globs.indexOf(glob) === index,
  );
  return `${command.head} --prune '${globsUnique.join(',')}' --mode apply`;
};
