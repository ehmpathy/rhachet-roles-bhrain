import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * .what = writes one whole file as an atomic swap: a peer draft, then a rename onto the path
 * .why = a file another reader may open mid-write (route state read by the stop hook or a
 *        guarded pour; a tally head read by a concurrent lane) must never be seen torn. an
 *        in-place write truncates first, so a reader mid-write meets an empty or half body. a
 *        rename within one dir is atomic, so a reader sees the prior file or the new one
 *        whole, never a half
 * .note = it lives in infra, since route and review.tally both write through it and neither
 *         may reach into the other
 *
 * .note = `mtime` (epoch ms), when given, is stamped onto the draft before the swap, so the
 *         body and its mtime land in one step — never a new body with the prior mtime
 * .note = the draft is removed in `finally`: a fault before the swap leaves no orphan; after
 *         the swap the draft path is already gone, so the remove is a no-op
 */
export const setOneFileAtomic = async (input: {
  path: string;
  content: string;
  mtime: number | null;
}): Promise<{ path: string }> => {
  // write the body to a peer draft, in the same dir so the rename stays atomic. the
  // draft is dot-led and ends on a uuid, so no glob over the real file's name or
  // suffix (`.route/*.json`, `*.md`) can match an orphan a kill left mid-write
  const draftPath = path.join(
    path.dirname(input.path),
    `.${path.basename(input.path)}.draft.${process.pid}.${randomUUID()}`,
  );
  await fs.mkdir(path.dirname(input.path), { recursive: true });
  try {
    await fs.writeFile(draftPath, input.content, 'utf-8');

    // stamp the mtime onto the draft, in seconds as utimes expects
    if (input.mtime !== null) {
      const mtimeSeconds = input.mtime / 1000;
      await fs.utimes(draftPath, mtimeSeconds, mtimeSeconds);
    }

    // swap the draft onto the path in one atomic step
    await fs.rename(draftPath, input.path);
  } finally {
    await fs.rm(draftPath, { force: true });
  }
  return { path: input.path };
};
