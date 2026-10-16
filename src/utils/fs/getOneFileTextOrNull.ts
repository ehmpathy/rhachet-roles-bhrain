import * as fs from 'fs/promises';

import { isErrorOfAbsence } from '@src/utils/fs/isErrorOfAbsence';

/**
 * .what = reads a file's utf-8 text, or null where the path is not there
 * .why = the one "read, null on absence, throw otherwise" every fs reader here shares.
 *        absence is the shared allowlist (`isErrorOfAbsence`: ENOENT and ENOTDIR); every
 *        other fault — a denial, a directory at the path — rethrows untouched, so a
 *        caller may wrap it in its own error class (rule.forbid.failhide)
 */
export const getOneFileTextOrNull = async (input: {
  path: string;
}): Promise<string | null> => {
  try {
    return await fs.readFile(input.path, 'utf-8');
  } catch (error) {
    // an absent path is a fact, never a fault
    if (isErrorOfAbsence({ error })) return null;
    throw error;
  }
};
