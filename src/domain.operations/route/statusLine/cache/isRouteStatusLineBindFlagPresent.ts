import * as fs from 'fs';
import * as path from 'path';

import { asRouteBindFlagName } from '@src/domain.operations/route/bind/asRouteBindFlagName';
import { isErrorOfAbsence } from '@src/utils/fs/isErrorOfAbsence';

import { asRouteStatusLineRouteDir } from './asRouteStatusLineRouteDir';

/**
 * .what = whether a route's own bind flag for a branch still stands on disk
 * .why = a miss whose cached route still holds its flag can render that route with no
 *        repo-wide bind glob; one stat replaces a walk of the whole repo
 *
 * .note = the flag name comes from its owner (`asRouteBindFlagName`), the template the bind
 *         write and the fingerprint share
 * .note = only absence reads as false; any other fs fault rethrows (rule.forbid.failhide)
 */
export const isRouteStatusLineBindFlagPresent = (input: {
  cwd: string;
  route: string;
  branch: string;
}): boolean => {
  const flagPath = path.join(
    asRouteStatusLineRouteDir({ cwd: input.cwd, route: input.route }),
    '.route',
    asRouteBindFlagName({ branch: input.branch }),
  );
  try {
    fs.statSync(flagPath);
    return true;
  } catch (error) {
    if (isErrorOfAbsence({ error })) return false;
    throw error;
  }
};
