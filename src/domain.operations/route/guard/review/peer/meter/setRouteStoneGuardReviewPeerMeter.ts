import * as fs from 'fs/promises';
import * as path from 'path';

import type { RouteStoneGuardReviewPeerMeter } from '@src/domain.objects/Driver/RouteStoneGuardReviewPeerMeter';

import { findsertRouteGitignore } from '../../../../gitignore/findsertRouteGitignore';
import { setRouteStatusLineFileOrWarn } from '../../../../statusLine/file/setRouteStatusLineFileOrWarn';

/**
 * .what = appends a review peer meter to reviewPeerMeters.jsonl, then refreshes the route's
 *         status file
 * .why = consolidates budget state into single file; a round moves the peer depth the
 *        status line shows, so the status file is rewritten with it
 *
 * .note = POSIX O_APPEND guarantees atomic writes for small entries
 * .note = the append is a ledger, non-idempotent by intent: each row records a reviewer's
 *         meter after a round. the reader keys rows by (stone, slug), last entry wins
 *         (`getAllRouteStoneGuardReviewPeerMeters`), so a row a retry duplicates is the same
 *         last entry, and no count moves
 * .note = under a stone's hold the status file rewrite waits until the hold releases
 *         (withStatusLineRefreshDeferred)
 */
export const setRouteStoneGuardReviewPeerMeter = async (input: {
  meter: RouteStoneGuardReviewPeerMeter;
  route: string;
}): Promise<{ path: string }> => {
  // ensure .route directory found or created
  const routeDir = path.join(input.route, '.route');
  await fs.mkdir(routeDir, { recursive: true });

  // findsert gitignore to ensure artifacts are ignored
  await findsertRouteGitignore({ route: input.route });

  // append meter as JSON line
  const metersPath = path.join(routeDir, 'reviewPeerMeters.jsonl');
  const jsonLine = JSON.stringify(input.meter) + '\n';
  await fs.appendFile(metersPath, jsonLine);

  // refresh the status file the status line reads: a round moves the peer depth it shows
  await setRouteStatusLineFileOrWarn({
    route: input.route,
    pointerAuthority: 'flag',
  });

  return { path: metersPath };
};
