import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * .what = drop every target path that resolves to a directory
 * .why = git records a symlink as one file entry, so a diff can name a
 *        symlink to a directory (e.g., `.claude` -> `.agent/.actors/...`).
 *        a directory holds no content to review, and a read of it fails
 *        with EISDIR. a path absent on disk (a deleted file) is kept — its
 *        diff is still reviewable.
 */
export const getAllTargetFilesExceptDirs = async (input: {
  files: string[];
  cwd: string;
}): Promise<string[]> => {
  // stat each path via its resolved target; a stat failure means absent, which is kept
  const verdicts = await Promise.all(
    input.files.map(async (file) => {
      const fullPath = path.isAbsolute(file)
        ? file
        : path.join(input.cwd, file);
      const stat = await fs.stat(fullPath).catch(() => null);
      return { file, isDir: stat?.isDirectory() ?? false };
    }),
  );

  // keep every path that is not a directory, in input order
  return verdicts.filter((v) => !v.isDir).map((v) => v.file);
};
