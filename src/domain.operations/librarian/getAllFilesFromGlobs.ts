import { existsSync } from 'fs';
import globby from 'globby';
import { ConstraintError } from 'helpful-errors';

/**
 * .what = the files a set of globs names, deduped and sorted; a set that names no file fails loud
 * .why = the census and moveout commands each expand a `--glob`. one expansion, so a `**` glob
 *        reads the same in all of them, and a typo'd glob halts rather than report a clean zero
 *
 * .note = node_modules is never walked and dotfiles match. a symlink to a file is returned; a
 *         caller that must skip a symlink checks lstat. a symlink to an absent target is dropped
 */
export const getAllFilesFromGlobs = async (input: {
  globs: string[];
}): Promise<string[]> => {
  const matches = await globby(input.globs, {
    ignore: ['**/node_modules/**'],
    dot: true,
  });
  const files = [...new Set(matches)].filter((file) => existsSync(file)).sort();

  // a glob set that names no file is a typo, never a clean zero
  if (files.length === 0)
    throw new ConstraintError('no file matched the --glob set', {
      globs: input.globs,
      hint: 'check the pattern; quote it so the shell does not expand it',
    });
  return files;
};
