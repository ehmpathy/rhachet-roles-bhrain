import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import { BadRequestError } from 'helpful-errors';
import * as path from 'path';

import { sanitizeBranchName } from '@src/domain.operations/review/sanitizeBranchName';
import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

/**
 * .what = binds a research directory to the current branch via flag file
 * .why = enables subsequent research commands to auto-resolve the research dir
 */
export const setResearchBind = async (input: {
  researchDir: string;
  cwd?: string;
}): Promise<{ researchDir: string; flagPath: string; branchName: string }> => {
  const cwd = input.cwd ?? process.cwd();
  // validate research directory found
  const researchAbsolute = path.resolve(input.researchDir);
  try {
    await fs.access(researchAbsolute);
  } catch {
    throw new BadRequestError(
      `research directory does not exist: ${input.researchDir}`,
      {
        researchDir: input.researchDir,
      },
    );
  }

  // get current branch
  const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd })
    .toString()
    .trim();

  // reject protected branches
  const protectedBranches = ['main', 'master'];
  if (protectedBranches.includes(branch))
    throw new BadRequestError('cannot bind research on protected branch', {
      branch,
    });

  // flatten branch name
  const branchFlat = sanitizeBranchName({ branch });

  // extract research name from directory path (e.g., v2026_02_09.consensus-algorithms -> consensus-algorithms)
  const researchDirName = path.basename(researchAbsolute);
  const researchName = researchDirName.replace(/^v\d{4}_\d{2}_\d{2}\./, '');

  // scan for pre-bound flags for this branch (exclude temp dirs from tests)
  const flagGlob = `**/.research/**/.bind/${branchFlat}.*.flag`;
  const flagFilesFound = await enumFilesFromGlob({
    glob: flagGlob,
    cwd: cwd,
    dot: true,
    ignore: ['**/.temp/**', '**/node_modules/**'],
  });

  // if found, check if same research or different
  if (flagFilesFound.length > 0) {
    const flagPathFound = flagFilesFound[0]!;
    const researchDirFound =
      path.relative(cwd, path.dirname(path.dirname(flagPathFound))) || '.';

    // same research → idempotent return
    const researchRelative = path.relative(cwd, researchAbsolute) || '.';
    if (researchDirFound === researchRelative)
      return {
        researchDir: researchRelative,
        flagPath: flagPathFound,
        branchName: branch,
      };

    // different research → error
    throw new BadRequestError(
      `already bound to ${researchDirFound}. use research.bind --del first`,
      { researchBound: researchDirFound, researchRequested: input.researchDir },
    );
  }

  // ensure .bind/ directory found
  const bindDir = path.join(researchAbsolute, '.bind');
  await fs.mkdir(bindDir, { recursive: true });

  // write flag file
  const flagFileName = `${branchFlat}.${researchName}.flag`;
  const flagPath = path.join(bindDir, flagFileName);
  const flagContent = `branch: ${branch}\nresearch: ${researchName}\nbound_by: init.research skill\n`;
  await fs.writeFile(flagPath, flagContent);

  const researchRelative = path.relative(cwd, researchAbsolute) || '.';
  return { researchDir: researchRelative, flagPath, branchName: branch };
};
