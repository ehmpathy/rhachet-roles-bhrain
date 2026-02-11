import { execSync } from 'child_process';
import { BadRequestError } from 'helpful-errors';
import * as path from 'path';

import { sanitizeBranchName } from '@src/domain.operations/review/sanitizeBranchName';
import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

/**
 * .what = resolves the bound research directory for the current branch
 * .why = enables auto-resolve of research dir from bind flag files
 */
export const getResearchBind = async (input?: {
  cwd?: string;
}): Promise<{ researchDir: string; name: string } | null> => {
  const cwd = input?.cwd ?? process.cwd();

  // get current branch
  const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd })
    .toString()
    .trim();

  // flatten branch name for flag file lookup
  const branchFlat = sanitizeBranchName({ branch });

  // scan for bind flag files (exclude temp dirs from tests)
  const flagGlob = `**/.research/**/.bind/${branchFlat}.*.flag`;
  const flagFiles = await enumFilesFromGlob({
    glob: flagGlob,
    cwd,
    dot: true,
    ignore: ['**/.temp/**', '**/node_modules/**'],
  });

  // no flags found → not bound
  if (flagFiles.length === 0) return null;

  // multiple flags found → ambiguity error
  if (flagFiles.length > 1)
    throw new BadRequestError(
      'multiple research directories bound to this branch. unbind one first',
      { branch, flagFiles },
    );

  // derive research path: flag is at <research>/.bind/{branch}.{name}.flag
  const flagPath = flagFiles[0]!;
  const researchDir =
    path.relative(cwd, path.dirname(path.dirname(flagPath))) || '.';

  // extract name from flag filename
  const flagFileName = path.basename(flagPath);
  const name = flagFileName.replace(`${branchFlat}.`, '').replace('.flag', '');

  return { researchDir, name };
};
