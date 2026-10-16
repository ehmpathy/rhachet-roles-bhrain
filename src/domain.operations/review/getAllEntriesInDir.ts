import * as fs from 'fs/promises';
import { UnexpectedCodePathError } from 'helpful-errors';

import { isErrorOfAbsence } from '@src/utils/fs/isErrorOfAbsence';
import { isErrorOfDenial } from '@src/utils/fs/isErrorOfDenial';

import type { Dirent } from 'node:fs';

/**
 * .what = lists a directory's entries, or null where the directory is not there
 * .why = readers here want "an absent dir is an empty corpus", never "an
 *        unreadable dir is an empty corpus" — a bare `.catch(() => null)`
 *        cannot tell the two apart, and grades a permission denial as a
 *        corpus of zero runs (rule.forbid.failhide). the sentinel stays,
 *        because absence is a fact these readers report on purpose: a tree
 *        that never reviewed has no log dir, and that is the answer
 *
 * .note = three dispositions, not two — absence answers `null`, a denial
 *         rethrows untouched so its errno survives, and every other errno
 *         takes the wrap (`isErrorOfDenial`)
 */
export const getAllEntriesInDir = async (input: {
  at: string;
}): Promise<Dirent[] | null> => {
  try {
    return await fs.readdir(input.at, { withFileTypes: true });
  } catch (error) {
    if (isErrorOfAbsence({ error })) return null;

    // a denial rethrows untouched, where every other errno takes the wrap
    // below — the wrap buries the errno inside a message, and the cli that
    // must refuse rather than crash would be left to pattern-match a string
    if (isErrorOfDenial({ error })) throw error;

    throw new UnexpectedCodePathError('could not read a directory', {
      at: input.at,
      error: String(error),
    });
  }
};
