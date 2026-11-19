import { getFsErrorCode } from '@src/utils/fs/getFsErrorCode';

import { asStatusLinePointerDropFaultRow } from '../asStatusLinePointerDropFaultRow';
import { asRouteStatusLinePointerPath } from './asRouteStatusLinePointerPath';
import { delRouteStatusLinePointer } from './delRouteStatusLinePointer';
import { getOneRepoRootFromCwdOrNull } from './getOneRepoRootFromCwdOrNull';

/**
 * .what = removes the branch's pointer; an fs fault of the removal warns on stderr, never fails
 * .why = the unbind is the act the caller asked for, and it already landed. the reader still
 *        checks the bind flag the pointer leads to, so a pointer left behind reads blank
 *
 * .note = only fs faults (a string `code`) warn; any other error rethrows
 */
export const delRouteStatusLinePointerOrWarn = async (input: {
  cwd: string;
  branch: string;
}): Promise<void> => {
  // anchor at the repo root, where the reader looks, whatever subdir the caller ran from
  const anchored = {
    cwd: getOneRepoRootFromCwdOrNull({ cwd: input.cwd }) ?? input.cwd,
    branch: input.branch,
  };

  // drop it; an fs fault warns
  try {
    await delRouteStatusLinePointer(anchored);
  } catch (error) {
    const code = getFsErrorCode(error);
    if (code === null) throw error;
    console.error(
      asStatusLinePointerDropFaultRow({
        code,
        pointerPath: asRouteStatusLinePointerPath(anchored),
      }),
    );
  }
};
