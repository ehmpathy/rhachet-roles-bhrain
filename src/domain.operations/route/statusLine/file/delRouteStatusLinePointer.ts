import * as fs from 'fs/promises';

import { asRouteStatusLinePointerPath } from './asRouteStatusLinePointerPath';

/**
 * .what = removes the branch's pointer; a no-op when none stands
 * .why = an unbind leaves the branch with no route, so the bash reader must print the blank
 *        line at once, not a route the branch let go
 */
export const delRouteStatusLinePointer = async (input: {
  cwd: string;
  branch: string;
}): Promise<void> => {
  await fs.rm(
    asRouteStatusLinePointerPath({ cwd: input.cwd, branch: input.branch }),
    { force: true },
  );
};
