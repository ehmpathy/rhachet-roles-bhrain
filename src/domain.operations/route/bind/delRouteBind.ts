import * as fs from 'fs/promises';

import { delRouteStatusLinePointerOrWarn } from '@src/domain.operations/route/statusLine/file/delRouteStatusLinePointerOrWarn';
import { getOneRepoRootFromCwdOrNull } from '@src/domain.operations/route/statusLine/file/getOneRepoRootFromCwdOrNull';

import { getAllBindFlagsByBranch } from './getAllBindFlagsByBranch';

/**
 * .what = removes the bind flag for the current branch, and the status line pointer with it
 * .why = enables clean unbind with idempotent semantics
 *
 * .note = the flags go first, the pointer last: a fault between the two then leaves a pointer
 *         whose route lost its flag, which the reader blanks on its own, never a bound branch
 *         with no pointer. both removals are idempotent, so the no-flag path runs the same steps
 * .note = the pointer drops on every path, the no-flag path included. with no flag left for
 *         this branch, any pointer is stale; the reader cannot check a `@multi-bind` mark, so
 *         only the drop clears one a hand unbind left
 * .note = the pointer anchors at the repo root, where the writers keep it, so an unbind run
 *         from a subdir drops the same pointer
 */
export const delRouteBind = async (): Promise<{ deleted: boolean }> => {
  // scan for this branch's bind flags
  const { branch, flagFiles } = await getAllBindFlagsByBranch({ branch: null });

  // remove each flag file found
  for (const flagPath of flagFiles) await fs.rm(flagPath, { force: true });

  // drop the status line pointer, so the bash reader prints the blank line at once
  const cwd =
    getOneRepoRootFromCwdOrNull({ cwd: process.cwd() }) ?? process.cwd();
  await delRouteStatusLinePointerOrWarn({ cwd, branch });

  // the node status line cache needs no drop: a bound seat's fingerprint stats this flag,
  // so its next repaint misses on its own
  return { deleted: flagFiles.length > 0 };
};
