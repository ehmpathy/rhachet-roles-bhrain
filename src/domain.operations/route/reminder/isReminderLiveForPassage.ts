import type { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import {
  isRouteGuardConcessionExhaustion,
  isRouteGuardUrgentConcessionExhaustion,
} from '../guard/review/peer/genRouteGuardExhaustedReason';
import { isReminderLiveForPassageStatus } from './isReminderLiveForPassageStatus';

/**
 * .what = decides whether a RouteReminder is live for one passage, by its status and its reason
 * .why = the status map answers "must a HUMAN act?" for every status but one. an `exhausted`
 *        status whose reason carries a concession mark, of either severity, is the driver's own
 *        move (the `better` fix, or the `urgent` grant), so a nudge there pokes a driver who CAN
 *        act — never the infiniloop the map guards against. the reason is the only channel that
 *        tells the two apart, the same one `asRouteStoneDisposition` reads
 *
 * .note = every other status defers to the exhaustive map, so a new status still fails closed
 */
export const isReminderLiveForPassage = (input: {
  status: PassageReport['status'];
  reason: string | null;
}): boolean => {
  // a concession exhaustion is the driver's own move → live
  if (
    input.status === 'exhausted' &&
    (isRouteGuardConcessionExhaustion({ reason: input.reason }) ||
      isRouteGuardUrgentConcessionExhaustion({ reason: input.reason }))
  )
    return true;

  // all else → the exhaustive status map
  return isReminderLiveForPassageStatus({ status: input.status });
};
