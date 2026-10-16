import * as fs from 'fs/promises';

import { isErrorOfAbsence } from '@src/utils/fs/isErrorOfAbsence';

/**
 * .what = the real (symlink-followed) path of a guard template, or null when it is absent
 * .why = the upgrade plan must check the REAL path stays inside the repo before it reads;
 *        this names that act. an absent template is a decision value (`absent-source`),
 *        never an error; any other fault (EACCES, ...) is server-side and propagates
 *
 * .note = absence is the shared allowlist (`isErrorOfAbsence`: ENOENT and ENOTDIR), so a
 *         template path whose parent is a file reads as absent, never as a raw stack
 */
export const getOneGuardTemplatePathOrNull = async (input: {
  path: string;
}): Promise<string | null> => {
  try {
    return await fs.realpath(input.path);
  } catch (error) {
    if (!isErrorOfAbsence({ error })) throw error;
    return null;
  }
};
