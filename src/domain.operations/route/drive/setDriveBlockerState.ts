import { DriveBlockerState } from './DriveBlocker';
import { mutateDriveBlockerState } from './mutateDriveBlockerState';

/**
 * .what = increments drive blocker count
 * .why = tracks consecutive stop blocks for safety cutoff
 *
 * 🔴 .note = `brain` is CARRIED THROUGH: to drop it would erase the inherited brain case=7
 *         renders on the first block tick after a switch. its writer is `setDriveEntryStone`
 */
export const setDriveBlockerState = async (input: {
  route: string;
  stone: string;
}): Promise<{ state: DriveBlockerState }> =>
  mutateDriveBlockerState({
    route: input.route,
    project: (before) =>
      new DriveBlockerState({
        count: before.count + 1,
        stone: input.stone,
        brain: before.brain,
      }),
  });
