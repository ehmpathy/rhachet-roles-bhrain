import * as fs from 'fs/promises';

import { asReviewLogsDir } from '@src/domain.operations/review/asReviewLogsDir';
import { getOneReviewedTreeAbove } from '@src/domain.operations/review/getOneReviewedTreeAbove';
import { isPathPresent } from '@src/domain.operations/review/isPathPresent';
import { isErrorOfAbsence } from '@src/utils/fs/isErrorOfAbsence';

/**
 * .what = the reviewed tree a dir IS, or the nearest one above it
 * .why = an empty grove from a sub-dir walks the tree's own children, so the tree
 *        itself must count — `getOneReviewedTreeAbove` starts one level up, and this
 *        is its twin that starts at the dir itself
 *
 * .note = it walks the REAL path, never a symlink's lexical parents: a symlinked dir
 *         would otherwise climb into whichever tree holds the link, which is not its
 *         ancestor. a dir removed since it was named reads as "no reviewed tree"
 *         (null), never a raw ENOENT; every other fault rethrows
 */
export const getOneReviewedTreeAtOrAbove = async (input: {
  at: string;
}): Promise<string | null> => {
  // the real path, or null where the dir is gone
  const atReal = await fs.realpath(input.at).catch((error: unknown) => {
    if (!isErrorOfAbsence({ error })) throw error;
    return null;
  });
  if (atReal === null) return null;

  // the dir itself counts: it is the tree a sub-dir run defaults onto
  if (await isPathPresent({ at: asReviewLogsDir({ cwd: atReal }) }))
    return atReal;
  return getOneReviewedTreeAbove({ cwd: atReal });
};
