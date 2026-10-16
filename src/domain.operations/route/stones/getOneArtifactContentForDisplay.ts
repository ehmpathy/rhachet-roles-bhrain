import * as fs from 'fs/promises';

import { isExpectedFsReadFault } from '../isExpectedFsReadFault';

/**
 * .what = the raw text of one guard artifact (review or judge), read for a stderr display —
 *         or `null` if the file is absent or unreadable
 * .why = the read is the i/o boundary of the blocked-passage display; named here, the
 *        render that indents it (`formatArtifactStderrBlock`) carries no raw `fs` call
 *        and no allowlist of its own (rule.prefer.decomposable-architecture)
 *
 * .note = the display falls back on ANY benign read fault (`isExpectedFsReadFault`: absent,
 *         denied, a directory in the file's place, …), since an unreadable artifact still
 *         earns its header and fallback line. every other fault rethrows (rule.forbid.failhide)
 */
export const getOneArtifactContentForDisplay = async (input: {
  path: string;
}): Promise<string | null> => {
  try {
    return await fs.readFile(input.path, 'utf-8');
  } catch (error) {
    // an absent or unreadable artifact is a display fallback, never a fault
    if (isExpectedFsReadFault({ error })) return null;
    throw error;
  }
};
