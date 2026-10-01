import * as fs from 'fs/promises';

import { isENOENT } from '../guard/isENOENT';

/**
 * .what = reads a file's text, and answers `null` where the file is absent
 * .why = the drive-state path reads an ABSENT file on its first tick of every route, so
 *        absence is the common case rather than a fault — and every other read fault
 *        (EACCES, EIO) must still travel, or a broken mount reads as fresh state
 *
 * .note = named, so five lock and reap sites share one agreement that absence is benign
 *         (`rule.prefer.wet-over-dry`)
 * .note = the catch is narrow on purpose: a bare `catch {}` would fold a permission error
 *         and a torn read into "absent" (`rule.forbid.failhide`)
 */
export const getOneFileText = async (input: {
  path: string;
}): Promise<string | null> =>
  await fs.readFile(input.path, 'utf-8').catch((error: unknown) => {
    if (isENOENT(error)) return null;
    throw error;
  });
