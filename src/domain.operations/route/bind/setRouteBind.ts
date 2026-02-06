import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import { BadRequestError } from 'helpful-errors';
import * as path from 'path';

import { sanitizeBranchName } from '@src/domain.operations/review/sanitizeBranchName';
import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

/**
 * .what = binds a route to the current branch via flag file
 * .why = enables subsequent route commands to auto-resolve --route
 */
export const setRouteBind = async (input: {
  route: string;
}): Promise<{ route: string; flagPath: string }> => {
  // validate route directory found
  const routeAbsolute = path.resolve(input.route);
  try {
    await fs.access(routeAbsolute);
  } catch {
    throw new BadRequestError(
      `route directory does not exist: ${input.route}`,
      {
        route: input.route,
      },
    );
  }

  // get current branch
  const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();

  // reject protected branches
  const protectedBranches = ['main', 'master'];
  if (protectedBranches.includes(branch))
    throw new BadRequestError('cannot bind route on protected branch', {
      branch,
    });

  // flatten branch name
  const branchFlat = sanitizeBranchName({ branch });

  // scan for pre-bound flags for this branch
  const flagGlob = `**/.route/.bind.${branchFlat}.flag`;
  const flagFilesFound = await enumFilesFromGlob({
    glob: flagGlob,
    cwd: process.cwd(),
    dot: true,
  });

  // if found, check if same route or different
  if (flagFilesFound.length > 0) {
    const flagPathFound = flagFilesFound[0]!;
    const routeDirFound =
      path.relative(process.cwd(), path.dirname(path.dirname(flagPathFound))) ||
      '.';

    // same route → idempotent return
    const routeRelative = path.relative(process.cwd(), routeAbsolute) || '.';
    if (routeDirFound === routeRelative)
      return { route: routeRelative, flagPath: flagPathFound };

    // different route → error
    throw new BadRequestError(
      `already bound to ${routeDirFound}. use route.bind --del first`,
      { routeBound: routeDirFound, routeRequested: input.route },
    );
  }

  // ensure .route/ directory found
  const routeStateDir = path.join(routeAbsolute, '.route');
  await fs.mkdir(routeStateDir, { recursive: true });

  // write flag file
  const flagFileName = `.bind.${branchFlat}.flag`;
  const flagPath = path.join(routeStateDir, flagFileName);
  const flagContent = `branch: ${branch}\nbound_by: route.bind skill\n`;
  await fs.writeFile(flagPath, flagContent);

  const routeRelative = path.relative(process.cwd(), routeAbsolute) || '.';
  return { route: routeRelative, flagPath };
};
