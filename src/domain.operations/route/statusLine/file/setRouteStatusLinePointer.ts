import * as path from 'path';

import { findsertGitignore } from '@src/domain.operations/route/gitignore/findsertGitignore';
import { setOneFileAtomic } from '@src/infra/fs/setOneFileAtomic';

import { asRouteStatusLinePointerPath } from './asRouteStatusLinePointerPath';
import { getOneRepoRootFromCwdOrNull } from './getOneRepoRootFromCwdOrNull';

/**
 * .what = writes the branch's pointer: one line, the route path or the multi-bind mark
 * .why = the bash reader reads this one fixed path to find the route bound to its branch
 *
 * .note = written whole as an atomic swap (`setOneFileAtomic`), so a reader sees the old
 *         pointer or the new one
 */
export const setRouteStatusLinePointer = async (input: {
  cwd: string;
  branch: string;
  value: string;
}): Promise<void> => {
  // anchor at the repo root, where the reader looks, whatever subdir the caller ran from
  const pointerPath = asRouteStatusLinePointerPath({
    cwd: getOneRepoRootFromCwdOrNull({ cwd: input.cwd }) ?? input.cwd,
    branch: input.branch,
  });

  // ensure the cache dir, and that it ignores itself
  await findsertGitignore({ dir: path.dirname(pointerPath), content: '*\n' });

  // write the pointer whole
  await setOneFileAtomic({
    path: pointerPath,
    content: `${input.value}\n`,
    mtime: null,
  });
};
