import { asRouteReminderSessionToken } from './asRouteReminderSessionToken';

/**
 * .what = the file stem a clone's RouteReminder handle files share, before the extension
 * .why = the clone home (getRouteReminderHandlePath) and the legacy sweep
 *        (delRouteReminderLegacyHandles) name one clone's handle by one stem. one builder keeps them
 *        on one form: a stem typed twice could drift, and a sweep with a drifted stem finds no
 *        legacy handle and reaps naught
 */
export const asRouteReminderHandleStem = (input: {
  cloneAddr: string;
}): string =>
  `daemon.of=reminder-driveon.session=${asRouteReminderSessionToken({
    cloneAddr: input.cloneAddr,
  })}`;
