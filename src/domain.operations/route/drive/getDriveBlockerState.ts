import {
  asDriveBlockerState,
  asFreshDriveBlockerState,
} from './asDriveBlockerState';
import {
  asDriveBlockerStatePath,
  type DriveBlockerState,
} from './DriveBlocker';
import { getOneFileText } from './getOneFileText';

/**
 * .what = reads current drive blocker state from .route/.drive.blockers.latest.json
 * .why = enables track of consecutive stop blocks AND the brain-dispatch entry edge
 *
 * 🔴 .note = only an ABSENT file degrades to fresh state; every other read fault rethrows.
 *           a bare catch would let an EACCES silently re-arm the 21-block cutoff to 0 and
 *           reset the entry marker (`rule.forbid.failhide`)
 * .note = the read is `getOneFileText`'s (absent → null, all else throws); the parse is
 *         `asDriveBlockerState`'s, where a torn-write read is a named, tested degrade
 */
export const getDriveBlockerState = async (input: {
  route: string;
}): Promise<DriveBlockerState> => {
  const statePath = asDriveBlockerStatePath({ route: input.route });

  // an absent file is the common first-tick case → fresh state, never an error
  const content = await getOneFileText({ path: statePath });

  if (content === null) return asFreshDriveBlockerState();
  return asDriveBlockerState({ content });
};
