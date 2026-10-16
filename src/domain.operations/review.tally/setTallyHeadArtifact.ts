import { createHash } from 'crypto';
import * as os from 'os';
import * as path from 'path';
import { genArtifactGitFile } from 'rhachet-artifact-git';

import { setOneFileAtomic } from '@src/infra/fs/setOneFileAtomic';

/**
 * .what = writes the tally prompt's static head to a content-keyed file, as a brief artifact
 * .why = 🔴 a brief becomes the SYSTEM message, and the system message is the only input a
 *        replica pin is derived from (rule.require.name-the-shared-prefix-as-the-cache-anchor).
 *        the tally head repeats byte-identical across every fallback tally of a run and across
 *        runs, so it must travel as the one brief — never as the first bytes of the user
 *        message, where an empty brief list casts to a system prompt of `''` and no pin forms
 *
 * .note = the path is keyed by the head's own digest, so one head maps to one file and a
 *         rewrite of identical bytes changes naught. the pin hashes the brief's TEXT, never
 *         its path, so where the file sits costs the pin naught
 * .note = it sits under the os temp dir, since a tally runs inside a guard or a review.by
 *         round with no run log dir of its own to hold it
 * .note = 🔴 the write is an atomic swap (`setOneFileAtomic`), never an in-place write. a
 *         guard pours lanes at once, and each lane that falls back to a tally rewrites this one
 *         path, then reads it as its system message. an in-place write truncates first, so a
 *         lane mid-read would meet an empty or half head and misread a verdict. the swap lets
 *         a reader see the whole head, always
 */
export const setTallyHeadArtifact = async (input: {
  head: string;
}): Promise<ReturnType<typeof genArtifactGitFile>> => {
  // key the path on the head's own digest, so one head maps to one file
  const digest = createHash('sha256')
    .update(input.head)
    .digest('hex')
    .slice(0, 16);
  const uri = path.join(
    os.tmpdir(),
    'rhachet-roles-bhrain',
    'review.tally',
    `head.${digest}.md`,
  );

  // swap the head into place whole, then hand it back as the brief artifact
  await setOneFileAtomic({ path: uri, content: input.head, mtime: null });
  return genArtifactGitFile({ uri });
};
