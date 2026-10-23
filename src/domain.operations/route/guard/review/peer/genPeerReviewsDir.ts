import * as fs from 'fs/promises';
import * as path from 'path';

import { SEGMENTS_OF_PEER_REVIEWS_DIR } from '@src/domain.operations/asPeerReviewOutputName';

/**
 * .what = findserts a route's peer reviews dir, and returns its path
 * .why = every lane writes its given, report, and `$targets` list into this one dir,
 *        so it must exist before the first write. drivers read it there (`.route/`
 *        is sealed)
 *
 * .note = `mkdir --recursive` never raises EEXIST, so N lanes that pour at once
 *         converge race-free. the `.gitignore` findsert is not race-free the same way,
 *         so it is hoisted to the guard pass rather than kept here
 */
export const genPeerReviewsDir = async (input: {
  route: string;
}): Promise<{ path: string }> => {
  const dir = path.join(input.route, ...SEGMENTS_OF_PEER_REVIEWS_DIR);
  await fs.mkdir(dir, { recursive: true });
  return { path: dir };
};
