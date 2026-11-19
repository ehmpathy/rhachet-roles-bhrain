import { isRouteStatusLineBindFlagPresent } from '../cache/isRouteStatusLineBindFlagPresent';
import { asRouteStatusLinePointerNext } from './asRouteStatusLinePointerNext';
import { asRouteStatusLineRouteRelative } from './asRouteStatusLineRouteRelative';
import { getOneRouteStatusLinePointer } from './getOneRouteStatusLinePointer';
import { setRouteStatusLinePointer } from './setRouteStatusLinePointer';

/**
 * .what = names the route in the branch pointer, where the route holds this branch's flag
 * .why = the bash reader finds the route through the pointer alone; a route not bound to
 *        this branch must leave the pointer to the route that is
 *
 * .note = with `pointerAuthority: 'lookup'` the caller ran the repo-wide bind lookup, so its
 *         route is the one answer and overwrites the pointer whole; with `'flag'` the writer
 *         knows only its own flag, so a pointer that names another bound route turns into the
 *         multi-bind mark (`asRouteStatusLinePointerNext`)
 */
export const setRouteStatusLinePointerWhereBound = async (input: {
  cwd: string;
  branch: string | null;
  route: string;
  pointerAuthority: 'lookup' | 'flag';
}): Promise<void> => {
  // no branch (detached HEAD, no .git) → no pointer to name
  if (input.branch === null) return;
  const branch = input.branch;

  // a route not bound to this branch names naught
  const isBound = isRouteStatusLineBindFlagPresent({
    cwd: input.cwd,
    route: input.route,
    branch,
  });
  if (!isBound) return;

  // decide the pointer value, then write it if it changed
  const route = asRouteStatusLineRouteRelative({
    cwd: input.cwd,
    route: input.route,
  });
  const value =
    input.pointerAuthority === 'lookup'
      ? route
      : await getOnePointerValueFromFlag({ cwd: input.cwd, branch, route });
  if (value === null) return;
  await setRouteStatusLinePointer({ cwd: input.cwd, branch, value });
};

/**
 * .what = the pointer value a writer that knows only its own flag should leave, or null
 * .why = a pointer that names another route whose flag still stands is a multi-bind
 */
const getOnePointerValueFromFlag = async (input: {
  cwd: string;
  branch: string;
  route: string;
}): Promise<string | null> => {
  const pointerFound = await getOneRouteStatusLinePointer({
    cwd: input.cwd,
    branch: input.branch,
  });
  return asRouteStatusLinePointerNext({
    pointerFound,
    route: input.route,
    isPeerFlagPresent: isPeerFlagPresent({ ...input, pointerFound }),
  });
};

/**
 * .what = whether the pointer names another route that still holds this branch's flag
 */
const isPeerFlagPresent = (input: {
  cwd: string;
  branch: string;
  route: string;
  pointerFound: string | null;
}): boolean => {
  if (input.pointerFound === null || input.pointerFound === input.route)
    return false;
  return isRouteStatusLineBindFlagPresent({
    cwd: input.cwd,
    route: input.pointerFound,
    branch: input.branch,
  });
};
