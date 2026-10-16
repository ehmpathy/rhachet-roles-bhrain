import * as path from 'path';

import { asPathAbsoluteFromCwd } from '@src/utils/asPathAbsoluteFromCwd';

/**
 * .what = where a route holds its partition declaration
 * .why = beside the route's other engine state (`passage.jsonl`, `reviewPeerMeters.jsonl`)
 */
export const asRouteGuardPartitionsPath = (input: {
  route: string;
  cwd: string;
}): string =>
  path.join(
    asPathAbsoluteFromCwd({ path: input.route, cwd: input.cwd }),
    '.route',
    'partitions.json',
  );
