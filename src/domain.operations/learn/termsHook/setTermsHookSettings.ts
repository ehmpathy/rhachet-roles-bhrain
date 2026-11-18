import { setOneFileAtomic } from '@src/infra/fs/setOneFileAtomic';

import { asSettingsText } from './asSettingsText';
import type { ClaudeSettingsOfRepo } from './ClaudeSettingsOfRepo';
import { getOneFileTextOrNull } from './getOneFileTextOrNull';

/**
 * .what = write the settings target whole, as an atomic swap, in the form it already had
 * .why = a reader with no lock (claude code at session start) sees the old file or the new
 *        one, never a torn write. the swap is the repo's one atomic write, `setOneFileAtomic`
 *
 * .note = the indent and trailer newline are kept as found (`asSettingsText`), so a toggle adds
 *         a diff of exactly its own block
 */
export const setTermsHookSettings = async (input: {
  path: string;
  settings: ClaudeSettingsOfRepo;
}): Promise<void> => {
  const textFound = await getOneFileTextOrNull({ path: input.path });
  await setOneFileAtomic({
    path: input.path,
    content: asSettingsText({ settings: input.settings, textFound }),
    mtime: null,
  });
};
