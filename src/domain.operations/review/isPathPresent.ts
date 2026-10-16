import * as fs from 'fs/promises';
import { UnexpectedCodePathError } from 'helpful-errors';

import { isErrorOfAbsence } from '@src/utils/fs/isErrorOfAbsence';

/**
 * .what = tells whether a path is there — and throws where it cannot tell
 * .why = a presence check is the shape where a bare catch reads most
 *        naturally and lies most completely: `.access(at).then(() => true)
 *        .catch(() => false)` answers a confident false for a path that
 *        exists and merely could not be reached — downstream that false
 *        picks the `refused` grade, which renders `$0` (rule.forbid.failhide).
 *        so the boolean is answered only where known: present, or absent. an
 *        errno that means neither is a defect, and surfaces
 */
export const isPathPresent = async (input: {
  at: string;
}): Promise<boolean> => {
  try {
    await fs.access(input.at);
    return true;
  } catch (error) {
    if (isErrorOfAbsence({ error })) return false;

    throw new UnexpectedCodePathError(
      'could not tell whether a path is there',
      {
        at: input.at,
        error: String(error),
      },
    );
  }
};
