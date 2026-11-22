import type { RouteReminderDriveActivity } from './getRouteReminderDriveActivity';

/**
 * .what = the label of why a route is not a live drive: the door that closed, plus the passage
 *         status behind it where one was read
 * .why = the door alone (`route-not-live`) does not part blocked from rewound or malfunction, and
 *        each one has a different fix. the status names which, so a human knows what restores it
 */
export const asRouteReminderHaltLabel = (input: {
  activity: Extract<RouteReminderDriveActivity, { active: false }>;
}): string => {
  const { reason, status } = input.activity;
  if (reason === 'route-not-live' && status)
    return `${reason}, status ${status}`;
  return reason;
};
