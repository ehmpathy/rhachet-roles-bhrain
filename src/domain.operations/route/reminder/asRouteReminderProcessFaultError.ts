import { BadRequestError } from 'helpful-errors';

import { asNodeErrnoCode } from '../asNodeErrnoCode';
import { getRouteReminderPidPath } from './getRouteReminderPidPath';
import { RouteReminderPidMalformedError } from './RouteReminderPidMalformedError';

/**
 * .what = maps a caught process-probe fault into the error a human command should throw — an EPERM
 *         pid-collision becomes a BadRequestError that states the fix, all else passes through.
 * .why = the process primitives (isProcessAlive / stopProcess) correctly rethrow any non-ESRCH
 *        errno rather than swallow it (rule.forbid.failhide) — but a raw `Error: kill EPERM …` shown
 *        to a human is a bare symptom with no fix (rule.require.errors-name-the-fix). the one errno
 *        this residual produces is EPERM: the pid the handle holds was recycled to a foreign process
 *        the daemon may not signal. the fix a human can take is concrete — remove the stale handle
 *        file — so this states it, with the exact path.
 *
 * .why pass-through = only EPERM is the known pid-collision residual. any OTHER caught error is
 *        returned unchanged, so this never hides an unexpected fault (rule.forbid.failhide).
 */
export const asRouteReminderProcessFaultError = (input: {
  error: unknown;
  repoRoot: string;
  cloneAddr: string;
}): unknown => {
  // the pid-path wrapper is the one home for the handle's pid path — never rebuild it inline
  const handlePath = getRouteReminderPidPath({
    repoRoot: input.repoRoot,
    cloneAddr: input.cloneAddr,
  });

  // a torn handle (a body that is no pid) is a state the human clears with one verb: name it
  if (input.error instanceof RouteReminderPidMalformedError)
    return new BadRequestError(
      'the reminder handle is torn — its body is not a pid, so no daemon can be read from it',
      {
        hint: 'clear it with: rhx route.reminder.del (it removes a torn handle; the next live drive registers afresh)',
        pidPath: handlePath,
        cloneAddr: input.cloneAddr,
      },
    );

  // only EPERM is the pid-reuse residual; every other errno / error passes through untouched
  if (asNodeErrnoCode(input.error) !== 'EPERM') return input.error;

  return new BadRequestError(
    'the reminder handle holds a pid this session may not signal — that pid was recycled to a foreign process (EPERM)',
    {
      hint: `remove the stale handle to clear it: rm ${handlePath}`,
      repoRoot: input.repoRoot,
      cloneAddr: input.cloneAddr,
    },
  );
};
