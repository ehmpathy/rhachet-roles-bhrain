import type { RouteGuardPartitionScope } from './RouteGuardPartitionScope';

/**
 * .what = the head and tail of the `route.guard.partition` command that declares one scope's
 *         set — the `--partition` flags sit between them
 * .why = every refusal that proposes a repaired route set — the stone entrance, a review run
 *        a route set split — must name the same command, so it is composed here, once
 */
export const asRouteGuardPartitionCommand = (input: {
  /**
   * the route dir, relative to cwd
   * .note = null where the surface knows no route (a halt remedy keyed on the stone alone); the
   *         command then omits `--route` and the skill reads the bound route
   */
  route: string | null;
  scope: RouteGuardPartitionScope;
}): { head: string; tail: string } => {
  const peerFlags =
    input.scope.kind === 'all'
      ? '--peer @all'
      : `--peer ${input.scope.peer} --stone ${input.scope.stone}`;
  const routeFlag = input.route === null ? '' : ` --route ${input.route}`;
  return {
    head: `rhx route.guard.partition${routeFlag} --for review ${peerFlags}`,
    tail: '  --mode apply',
  };
};
