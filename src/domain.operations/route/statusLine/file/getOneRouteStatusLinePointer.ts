import { getOneFileTextOrNull } from '@src/utils/fs/getOneFileTextOrNull';

import { asRouteStatusLinePointerPath } from './asRouteStatusLinePointerPath';
import { getOneRepoRootFromCwdOrNull } from './getOneRepoRootFromCwdOrNull';

/**
 * .what = the branch's pointer value (a route path or the multi-bind mark), or null if absent
 * .why = a writer reads it before it names its own route, so a second bound route turns the
 *        pointer into the multi-bind mark rather than overwrites the first
 *
 * .note = only absence reads as null; any other fs fault rethrows (`getOneFileTextOrNull`)
 */
export const getOneRouteStatusLinePointer = async (input: {
  cwd: string;
  branch: string;
}): Promise<string | null> => {
  // anchor at the repo root, where the writers keep it, whatever subdir the caller ran from
  const content = await getOneFileTextOrNull({
    path: asRouteStatusLinePointerPath({
      cwd: getOneRepoRootFromCwdOrNull({ cwd: input.cwd }) ?? input.cwd,
      branch: input.branch,
    }),
  });
  return content?.trim() || null;
};
