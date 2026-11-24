import { isRouteReminderFocusOn } from './isRouteReminderFocusOn';

/**
 * .what = whether a tick that read a dead focus owes a fresh judgment of the focus
 * .why = a drive can move the focus to a live route after a tick read a dead one, then see the
 *        daemon live and spawn none. a live focus is nudged as read; a dead one is judged afresh only
 *        while refocuses remain, and only when the focus no longer names the route the tick read
 */
export const isRouteReminderRefocusOwed = async (input: {
  repoRoot: string;
  cloneAddr: string;
  refocusesLeft: number;
  isActive: boolean;
  route: string;
}): Promise<boolean> => {
  if (input.isActive) return false;
  if (input.refocusesLeft <= 0) return false;
  const isFocusStillHere = await isRouteReminderFocusOn({
    repoRoot: input.repoRoot,
    cloneAddr: input.cloneAddr,
    route: input.route,
  });
  return !isFocusStillHere;
};
