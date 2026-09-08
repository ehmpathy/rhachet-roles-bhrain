import * as fs from 'fs/promises';

import { enumRouteGuardReviewPeerFiles } from '../guard/review/peer/enumRouteGuardReviewPeerFiles';
import { getRouteGuardReviewPeerPathTaken } from '../guard/review/peer/getRouteGuardReviewPeerPathTaken';

/**
 * .what = writes a .taken.by_self beside every .given.by_peer on a stone,
 *         as a driver does with `--as contemplated`
 * .why = the entrance gate refuses a new review round while an articulation is
 *        owed, so any test that drives more than one round must converse between
 *        them. without this a multi-round test halts at the door, and the halt
 *        is correct — an edit alone can no longer buy re-entry
 *
 * .note = the taken path is derived from its given via the production transformer,
 *         never rebuilt from parts, so the pair cannot silently desync
 *
 * .note = 🔴 the write takes the derived path BARE — no path.join(input.route, …).
 *         enumRouteGuardReviewPeerFiles hands back ABSOLUTE paths (enumFilesFromGlob
 *         calls globby with `absolute: true`), and the transformer swaps one infix
 *         and keeps every other segment, so a derived taken path is absolute too.
 *         path.join concatenates — it does NOT drop a separator that opens a later
 *         segment — so a join here writes to `$route$route/.reviews/…` and every
 *         caller fails ENOENT. clamped by enumRouteGuardReviewPeerFiles [case8],
 *         which pins the absoluteness contract this leans on.
 */
export const answerEveryPeerGiven = async (input: {
  route: string;
  stone: string;
}): Promise<string[]> => {
  const pathsGiven = await enumRouteGuardReviewPeerFiles({
    route: input.route,
    stone: input.stone,
    kind: 'given',
  });

  const pathsTaken = pathsGiven.map((pathGiven) =>
    getRouteGuardReviewPeerPathTaken({ pathGiven }),
  );

  await Promise.all(
    pathsTaken.map(async (pathTaken) =>
      fs.writeFile(
        pathTaken,
        '[REPAIR] answered — the repair is in the artifact',
      ),
    ),
  );

  return pathsTaken;
};
