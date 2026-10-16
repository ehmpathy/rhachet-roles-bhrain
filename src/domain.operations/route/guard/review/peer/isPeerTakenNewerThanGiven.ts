import * as fs from 'fs/promises';

import { isErrorOfAbsence } from '@src/utils/fs/isErrorOfAbsence';

import { getRouteGuardReviewPeerPathTaken } from './getRouteGuardReviewPeerPathTaken';

/**
 * .what = decides whether the driver has posted a response newer than a given
 * .why = a .taken.by_self written after its .given.by_peer means "reconsider" — it
 *        forces a conversation-enabled reviewer to re-run so it can see the response
 *        and drop a refuted blocker. once the reviewer re-runs it overwrites the given
 *        (newer mtime), so the trigger clears; a further response bumps it again,
 *        bounded by budget.
 * .note = mtime order stands in for author order because the two files are written by
 *         different actors a read apart. an external re-stamp could move it; the cost
 *         self-heals on the next write to either file.
 * .note = a communicator (two `fs.stat` reads), so it sits in `peer/` beside the path it
 *         pairs, never inside the orchestrator that consumes it
 */
export const isPeerTakenNewerThanGiven = async (input: {
  pathGiven: string;
}): Promise<boolean> => {
  const pathTaken = getRouteGuardReviewPeerPathTaken({
    pathGiven: input.pathGiven,
  });
  try {
    const [givenStat, takenStat] = await Promise.all([
      fs.stat(input.pathGiven),
      fs.stat(pathTaken),
    ]);
    return takenStat.mtimeMs > givenStat.mtimeMs;
  } catch (error) {
    // no taken (or no given) on disk → no response to reconsider
    if (isErrorOfAbsence({ error })) return false;
    throw error;
  }
};
