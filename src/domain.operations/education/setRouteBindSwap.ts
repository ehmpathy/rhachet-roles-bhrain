import { HelpfulError } from 'helpful-errors';
import { withSimpleMutex } from 'with-simple-mutex';

import { delRouteBind } from '@src/domain.operations/route/bind/delRouteBind';
import { getAllBindFlagsByBranch } from '@src/domain.operations/route/bind/getAllBindFlagsByBranch';
import { getRouteBindByBranch } from '@src/domain.operations/route/bind/getRouteBindByBranch';
import { setRouteBind } from '@src/domain.operations/route/bind/setRouteBind';

import { getOneRouteBindSwapCache } from './getOneRouteBindSwapCache';

/**
 * .what = move the branch bind from whatever route holds it to `route`
 * .why = a branch holds one bind at a time and setRouteBind refuses a second, so a push
 *        into a course and a pop back to its pursuit are each a swap: del, then set
 *
 * .note = a set that faults re-sets the prior bind, then rethrows; a swap never strands the
 *         branch bound to naught. del precedes set because a reader refuses two flags
 * .note = the del and the set run under one hold keyed on the branch, so a concurrent
 *         swap never interleaves with this one. the hold spans two small disk writes, so a
 *         30s lease bounds a stalled holder and a crashed one frees the key in 30s
 * .note = the acquire waits past the lease (35s > 30s), so a waiter behind a crashed holder
 *         takes the key once it frees; a refusal then means a holder alive and slow
 * .note = idempotent: a swap to the route already bound is a del plus a re-set of it
 */
export const setRouteBindSwap = async (input: {
  route: string;
  repoRoot: string;
}): Promise<{ route: string; flagPath: string }> => {
  const { branch } = await getAllBindFlagsByBranch({ branch: null });
  const held = withSimpleMutex(
    async (_: { branch: string }) => {
      const prior = await getRouteBindByBranch({ branch: null });
      await delRouteBind();
      return setRouteBindOrRestore({ route: input.route, prior });
    },
    {
      key: (holdOf) => `bind.swap.${holdOf.branch}`,
      cache: getOneRouteBindSwapCache({ repoRoot: input.repoRoot }),
      lease: { duration: { seconds: 30 } },
      acquire: { timeout: { seconds: 35 }, interval: { milliseconds: 25 } },
    },
  );
  return held({ branch });
};

/**
 * .what = set the bind to `route`; on a fault, re-set the prior bind and rethrow with context
 * .why = the del already ran, so a bare fault would leave the branch bound to naught, and no
 *        education verb recovers from an unbound branch
 */
const setRouteBindOrRestore = async (input: {
  route: string;
  prior: { route: string } | null;
}): Promise<{ route: string; flagPath: string }> => {
  try {
    return await setRouteBind({ route: input.route });
  } catch (error) {
    if (!(error instanceof Error)) throw error;
    await setRouteBindRestored({
      prior: input.prior,
      cause: error,
      target: input.route,
    });
    throw new HelpfulError('bind swap failed; the prior bind was restored', {
      cause: error,
      routeTarget: input.route,
      routeRestored: input.prior?.route ?? null,
    });
  }
};

/**
 * .what = re-set the prior bind after a swap's set faulted; on a second fault, name both
 * .why = the del already ran, so a restore that faults leaves the branch unbound; the error
 *        must say so, carry both causes, and give the command that rebinds it
 */
const setRouteBindRestored = async (input: {
  prior: { route: string } | null;
  cause: Error;
  target: string;
}): Promise<void> => {
  if (!input.prior) return;
  try {
    await setRouteBind({ route: input.prior.route });
  } catch (errorOfRestore) {
    if (!(errorOfRestore instanceof Error)) throw errorOfRestore;
    throw new HelpfulError(
      'bind swap failed, and so did its restore; the branch is now bound to no route',
      {
        cause: input.cause,
        causeOfRestore: errorOfRestore.message,
        routeTarget: input.target,
        routePrior: input.prior.route,
        hint: `rebind the branch by hand: rhx route.bind.set --route ${input.prior.route}`,
      },
    );
  }
};
