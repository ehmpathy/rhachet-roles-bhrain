import * as fs from 'fs/promises';
import { BadRequestError } from 'helpful-errors';
import * as path from 'path';

import { isErrorOfAbsence } from '@src/utils/fs/isErrorOfAbsence';

import { asRouteBindFlagName } from './asRouteBindFlagName';
import { asRouteDirFromBindFlagPath } from './asRouteDirFromBindFlagPath';
import { getAllBindFlagsByBranch } from './getAllBindFlagsByBranch';
import { MESSAGE_OF_MULTI_BIND } from './MESSAGE_OF_MULTI_BIND';
import { setOneRouteBindFlagFile } from './setOneRouteBindFlagFile';

/**
 * .what = writes the bind flag for the current branch, or finds the one that stands
 * .why = the flag is the bind; a second bind of the same route is idempotent, and a bind of
 *        another route while one stands is refused
 *
 * .note = no lock: two binds of different routes at once each find no flag and each write
 *         their own, since each route keeps its flag in its own dir. so after its write, a
 *         bind scans again; a second flag found then raises the multi-bind fault, the same
 *         fault the bind lookup raises, which the caller marks on the status line. the race
 *         ends loud and rendered, never as a silent second bind
 */
export const setRouteBindFlag = async (input: {
  route: string;
  cwd: string;
}): Promise<{ route: string; flagPath: string }> => {
  // the route must be a dir that exists
  const routeAbsolute = path.resolve(input.cwd, input.route);
  await assertRouteDirFound({ route: input.route, routeAbsolute });

  // scan for the flags this branch already holds
  const { branch, flagFiles } = await getAllBindFlagsByBranch({ branch: null });

  // reject protected branches
  if (isProtectedBranch({ branch }))
    throw new BadRequestError(
      'cannot bind route on protected branch; switch to a feature branch first',
      { branch },
    );

  // several routes already hold this branch's flag → the multi-bind fault
  if (flagFiles.length > 1) throwMultiBindFault({ branch, flagFiles });

  // one flag stands → idempotent for the same route, refused for another
  const flagPath = path.join(
    routeAbsolute,
    '.route',
    asRouteBindFlagName({ branch }),
  );
  const routeRelative = asRouteDirFromBindFlagPath({
    cwd: input.cwd,
    flagPath,
  });
  const [flagPathFound] = flagFiles;
  if (flagPathFound) {
    const routeFound = asRouteDirFromBindFlagPath({
      cwd: input.cwd,
      flagPath: flagPathFound,
    });
    if (routeFound !== routeRelative)
      throw new BadRequestError(
        `already bound to ${routeFound}. use route.bind --del first`,
        { routeFound, routeAsked: routeRelative, branch },
      );
    return { route: routeRelative, flagPath: flagPathFound };
  }

  // write the flag, exclusive: a concurrent bind of the same route that wrote it first wins
  await setOneRouteBindFlagFile({
    flagPath,
    content: asRouteBindFlagContent({ branch }),
  });

  // scan again: a concurrent bind of another route may have written its own flag
  const { flagFiles: flagFilesAfter } = await getAllBindFlagsByBranch({
    branch,
  });
  if (flagFilesAfter.length > 1)
    throwMultiBindFault({ branch, flagFiles: flagFilesAfter });
  return { route: routeRelative, flagPath };
};

/**
 * .what = asserts the route is a dir that exists; only an absent path reads as not found
 * .why = a permission or i/o fault must surface as itself, never as "does not exist"
 */
const assertRouteDirFound = async (input: {
  route: string;
  routeAbsolute: string;
}): Promise<void> => {
  const stat = await fs.stat(input.routeAbsolute).catch((error: unknown) => {
    if (!isErrorOfAbsence({ error })) throw error;
    return null;
  });
  if (!stat)
    throw new BadRequestError(
      `route directory does not exist: ${input.route}; check the path, or run rhx route.bind.get`,
      { route: input.route },
    );
  if (!stat.isDirectory())
    throw new BadRequestError(
      `route is not a directory: ${input.route}; bind the route dir, not a file in it`,
      { route: input.route },
    );
};

/**
 * .what = whether a branch is one a route may not bind to
 */
const isProtectedBranch = (input: { branch: string }): boolean =>
  ['main', 'master'].includes(input.branch);

/**
 * .what = the bytes a bind flag holds
 */
const asRouteBindFlagContent = (input: { branch: string }): string =>
  `branch: ${input.branch}\nbound_by: route.bind skill\n`;

/**
 * .what = throws the multi-bind fault, with the fix
 * .why = the head is the bind lookup's own text (`MESSAGE_OF_MULTI_BIND`), so every caller
 *        that marks the status line on it detects both sources one way
 */
const throwMultiBindFault = (input: {
  branch: string;
  flagFiles: string[];
}): never => {
  throw new BadRequestError(
    `${MESSAGE_OF_MULTI_BIND}. run rhx route.bind.del, then bind the one route`,
    input,
  );
};
