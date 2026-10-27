import { getFsErrorCode } from '@src/utils/fs/getFsErrorCode';

import { asStatusLinePointerWriteFaultRow } from '../asStatusLinePointerWriteFaultRow';
import { getOneBranchFromHeadFileOrNull } from '../cache/getOneBranchFromHeadFileOrNull';
import { asRouteStatusLinePointerPath } from './asRouteStatusLinePointerPath';
import { getOneRepoRootFromCwdOrNull } from './getOneRepoRootFromCwdOrNull';
import { MARK_OF_MULTI_BIND } from './MARK_OF_MULTI_BIND';
import { setRouteStatusLinePointer } from './setRouteStatusLinePointer';

/**
 * .what = marks this branch's pointer as a multi-bind; an fs fault warns, never fails
 * .why = the bash reader cannot walk the repo to find a second bind flag. the bind lookup can,
 *        and when it faults on a multi-bind, this mark makes the reader print the fault line
 *        rather than one of the two routes
 *
 * .note = the caller rethrows the multi-bind fault after this; the mark is a side note only
 * .note = only fs faults (a string `code`) warn; any other error rethrows
 */
export const setRouteStatusLinePointerAsMultiBindOrWarn = async (input: {
  cwd: string;
}): Promise<void> => {
  // anchor at the repo root, where the reader looks, whatever subdir the caller ran from
  const cwd = getOneRepoRootFromCwdOrNull({ cwd: input.cwd }) ?? input.cwd;

  // no branch (detached HEAD, no .git) → no pointer to mark
  const branch = getOneBranchFromHeadFileOrNull({ cwd });
  if (branch === null) return;

  try {
    await setRouteStatusLinePointer({
      cwd,
      branch,
      value: MARK_OF_MULTI_BIND,
    });
  } catch (error) {
    const code = getFsErrorCode(error);
    if (code === null) throw error;
    console.error(
      asStatusLinePointerWriteFaultRow({
        code,
        pointerPath: asRouteStatusLinePointerPath({ cwd, branch }),
      }),
    );
  }
};
