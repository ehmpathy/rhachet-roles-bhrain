import * as path from 'path';

import { asRouteStatusLineRouteDir } from '../cache/asRouteStatusLineRouteDir';
import { NAME_OF_ROUTE_STATUS_LINE_FILE } from './NAME_OF_ROUTE_STATUS_LINE_FILE';

/**
 * .what = the status file of a route: `$route/.route/.status.line.json`
 * .why = the file the writers keep beside the route and the bash reader prints from
 *
 * .note = the route's own `.route/.gitignore` ignores all but `passage.jsonl` and `.bind.*`,
 *         so the file is never tracked
 */
export const asRouteStatusLineFilePath = (input: {
  cwd: string;
  route: string;
}): string =>
  path.join(
    asRouteStatusLineRouteDir({ cwd: input.cwd, route: input.route }),
    '.route',
    NAME_OF_ROUTE_STATUS_LINE_FILE,
  );
