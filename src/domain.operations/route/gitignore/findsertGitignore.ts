import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * .what = findserts a `.gitignore` of fixed content into a directory
 *
 * .why = three call sites once held three copies of this body, and copies of
 *        one concept drift. they had already drifted on TWO axes at once:
 *
 *        | | peer / self | route |
 *        |---|---|---|
 *        | a non-ENOENT read error | rethrown | 🔴 swallowed by `.catch(() => null)` |
 *        | hoisted out of the concurrent pour? | ✅ yes | 🔴 no — called per lane |
 *
 *        ⇒ the swallow is a `rule.forbid.failhide` regression that sat BESIDE
 *        the peer copy, which was hardened for exactly that reason. that is the
 *        shape a duplicate always takes: a repair lands on the copy whoever
 *        opened the file could see, and the others keep the defect.
 *
 * .note = this is idempotent by CONVERGENCE, never by a guard. a re-run
 *         re-reads, finds the content equal, and returns `unchanged`. two
 *         concurrent writers of the SAME bytes therefore cannot corrupt the
 *         file — which is why the per-lane race is benign today, and why it is
 *         still worth removal: the benignity is a property of each CALLER's
 *         content, a compile-time constant, never of this operation
 *
 * .note = a non-ENOENT read error is RETHROWN. an EISDIR or EACCES means the
 *         path is not what we think it is, and to write over that in silence is
 *         how a real fault becomes an absent gitignore nobody notices
 */
export const findsertGitignore = async (input: {
  dir: string;
  content: string;
}): Promise<{ path: string; action: 'created' | 'unchanged' }> => {
  const gitignorePath = path.join(input.dir, '.gitignore');

  // ensure the target dir found or created
  await fs.mkdir(input.dir, { recursive: true });

  // read what is there, if aught
  const contentFound = await fs
    .readFile(gitignorePath, 'utf-8')
    .catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
  if (contentFound === input.content)
    return { path: gitignorePath, action: 'unchanged' };

  // write it
  await fs.writeFile(gitignorePath, input.content);
  return { path: gitignorePath, action: 'created' };
};
