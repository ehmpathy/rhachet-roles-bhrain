import { delRouteStatusLineCacheOrWarn } from '@src/domain.operations/route/statusLine/cache/delRouteStatusLineCacheOrWarn';
import { setRouteStatusLineFileOrWarn } from '@src/domain.operations/route/statusLine/file/setRouteStatusLineFileOrWarn';
import { setRouteStatusLinePointerAsMultiBindOrWarn } from '@src/domain.operations/route/statusLine/file/setRouteStatusLinePointerAsMultiBindOrWarn';

import { isRouteBindMultiBindFault } from './isRouteBindMultiBindFault';
import { setRouteBindFlag } from './setRouteBindFlag';

/**
 * .what = binds a route to the current branch via flag file
 * .why = enables subsequent route commands to auto-lookup --route
 *
 * .note = every bind drops the status line cache, a re-bind of the same route included, so
 *         the next repaint names the bound route at once. the drop is idempotent, so it runs
 *         from one exit, after the flag is settled
 * .note = a multi-bind found by the flag write marks the branch's status line pointer before
 *         the fault propagates, so the bash reader prints the fault line, the same mark
 *         route.drive leaves on the lookup's fault
 */
export const setRouteBind = async (input: {
  route: string;
}): Promise<{ route: string; flagPath: string }> => {
  const cwd = process.cwd();
  const bound = await setRouteBindFlagOrMarkMultiBind({
    route: input.route,
    cwd,
  });
  await delRouteStatusLineCacheOrWarn({ cwd });

  // write the bound route's status file and name it in the branch pointer: the bind ran the
  // repo-wide lookup, so its route is the one answer
  await setRouteStatusLineFileOrWarn({
    route: bound.route,
    pointerAuthority: 'lookup',
  });
  return bound;
};

/**
 * .what = the flag write, with the status line pointer marked on a multi-bind
 * .note = the catch allowlists only the multi-bind fault, and rethrows it after the mark;
 *         every other error rethrows untouched (rule.forbid.failhide)
 */
const setRouteBindFlagOrMarkMultiBind = async (input: {
  route: string;
  cwd: string;
}): Promise<{ route: string; flagPath: string }> => {
  try {
    return await setRouteBindFlag(input);
  } catch (error) {
    if (isRouteBindMultiBindFault({ error }))
      await setRouteStatusLinePointerAsMultiBindOrWarn({ cwd: input.cwd });
    throw error;
  }
};
