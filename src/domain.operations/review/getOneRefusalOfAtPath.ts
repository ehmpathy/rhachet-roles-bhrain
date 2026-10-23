import * as fs from 'fs/promises';
import * as path from 'path';

import { isErrorOfAbsence } from '@src/utils/fs/isErrorOfAbsence';

/**
 * .what = the refusal a `--at` path earns when it names no directory — absent, or a file
 * .why = all three cost breadths read `--at` as a directory. a path that is not there, or
 *        that names a file, is a typo or a stale path; to answer it with "run a review
 *        here" or with an empty grove names the wrong fix. stated once, so the three
 *        breadths refuse a bad path in the same words
 *        (rule.require.errors-name-the-fix, rule.forbid.duplicate-format-tree-operations)
 *
 * .note = one stat, its absence handled inside it — never a probe then a read, since a
 *         path removed between the two would escape as a raw ENOENT rather than this
 *         refusal. every fault other than an absence rethrows
 */
export const getOneRefusalOfAtPath = async (input: {
  at: string;
}): Promise<{ headline: string; fix: string } | null> => {
  // stat the absolute path; an absence reads as null.
  // `path.resolve` is node's own name for the absolute-path cast
  const atAbsolute = path.resolve(input.at);
  const stat = await fs.stat(atAbsolute).catch((error: unknown) => {
    if (!isErrorOfAbsence({ error })) throw error;
    return null;
  });

  // absent: no directory at all
  if (stat === null)
    return {
      headline: `--at names a directory that is not there: ${atAbsolute}`,
      fix: 'check the --at path, then point it at a tree where reviews ran',
    };

  // present, but a file: the read would descend into naught
  if (!stat.isDirectory())
    return {
      headline: `--at names a file, not a directory: ${atAbsolute}`,
      fix: `point --at at the directory that holds it: ${path.dirname(atAbsolute)}`,
    };

  return null;
};
