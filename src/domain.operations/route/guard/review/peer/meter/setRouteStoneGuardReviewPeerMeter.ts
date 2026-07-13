import * as fs from 'fs/promises';
import * as path from 'path';

import type { RouteStoneGuardReviewPeerMeter } from '@src/domain.objects/Driver/RouteStoneGuardReviewPeerMeter';

import { findsertRouteGitignore } from '../../../../gitignore/findsertRouteGitignore';

/**
 * .what = appends a review peer meter to reviewPeerMeters.jsonl
 * .why = consolidates budget state into single file
 * .note = POSIX O_APPEND guarantees atomic writes for small entries
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

  return { path: metersPath };
};
