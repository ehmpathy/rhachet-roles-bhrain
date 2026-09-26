import { BadRequestError } from 'helpful-errors';

import { asNodeErrnoCode } from '../asNodeErrnoCode';
import { getRouteReminderPidPath } from './getRouteReminderPidPath';

/**
 * .what = maps a caught process-probe fault into the error a human command should throw — an EPERM
 *         pid-collision becomes a BadRequestError that states the fix, all else passes through.
 * .why = the process primitives (isProcessAlive / stopProcess) correctly rethrow any non-ESRCH
 *        errno rather than swallow it (rule.forbid.failhide) — but a raw `Error: kill EPERM …` shown
 *        to a human is a bare symptom with no fix, unlike every other cli error path here, which
 *        throws a BadRequestError that states the next move (rule.require.errors-name-the-fix). the
 *        one errno this residual produces is EPERM: the pid the handle holds was recycled to a
 *        foreign process the daemon may not signal (the documented pid-as-identity residual in
 *        isProcessAlive). the fix a human can take is concrete — remove the stale handle file — so
 *        this states it, with the exact path.
 *
 * .why pass-through = only EPERM is the known pid-collision residual. any OTHER caught error (a fs
 *        fault off the handle read, an EINVAL, a torn-handle parse error) is NOT this residual, so it
 *        is returned unchanged to rethrow as-is — this transformer never hides an unexpected fault
 *        behind the pid-collision message (rule.forbid.failhide).
 *
 * returns the error to throw: a BadRequestError that states the fix for the EPERM residual, else the
 * original caught error unchanged. a pure map (caught error → error to throw), so the caller reads
 * `throw asRouteReminderProcessFaultError({ error, route, cloneAddr })` with no inline branch.
 */
export const asRouteReminderProcessFaultError = (input: {
  error: unknown;
  route: string;
  cloneAddr: string;
}): unknown => {
  // only EPERM is the pid-reuse residual (the handle's pid was recycled to a foreign process).
  // every other errno / error is not this residual — pass it through untouched.
  if (asNodeErrnoCode(input.error) !== 'EPERM') return input.error;

  // the pid-path wrapper is the one home for the handle's pid path — never rebuild it inline
  const handlePath = getRouteReminderPidPath({
    route: input.route,
    cloneAddr: input.cloneAddr,
  });
  return new BadRequestError(
    'the reminder handle holds a pid this session may not signal — that pid was recycled to a foreign process (EPERM)',
    {
      hint: `remove the stale handle to clear it: rm ${handlePath}`,
      route: input.route,
      cloneAddr: input.cloneAddr,
    },
  );
};
