import { types } from 'util';

import { isToleratedIoWriteError } from './isToleratedIoWriteError';
import { RouteReminderPidMalformedError } from './RouteReminderPidMalformedError';

/**
 * .what = whether a fault on one legacy handle reap is of an expected class
 * .why = the sweep keeps a handle and moves on only for faults it can name: a host io fault (EPERM
 *        on a recycled pid, EACCES on the handle dir) or a torn pid file. any other class is a
 *        defect, so the sweep rethrows it (rule.forbid.failhide)
 */
export const isExpectedLegacyReapFault = (input: {
  error: unknown;
}): boolean => {
  // isNativeError, never `instanceof Error`: a node fs error from another vm realm fails `instanceof`
  if (!types.isNativeError(input.error)) return false;
  if (isToleratedIoWriteError({ error: input.error })) return true;
  return input.error instanceof RouteReminderPidMalformedError;
};
