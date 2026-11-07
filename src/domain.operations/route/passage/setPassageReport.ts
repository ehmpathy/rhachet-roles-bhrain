import * as fs from 'fs/promises';
import * as path from 'path';

import type { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import { findsertRouteGitignore } from '../gitignore/findsertRouteGitignore';
import { setRouteStatusLineFileOrWarn } from '../statusLine/file/setRouteStatusLineFileOrWarn';

/**
 * .what = appends a passage report to passage.jsonl
 * .why = consolidates passage state into single file
 * .note = POSIX O_APPEND guarantees atomic writes for small entries
 * .note = every passage moves the status line, so its last act rewrites the route's status
 *         file; a fault there warns and never refuses the passage. under a stone's hold the
 *         rewrite waits until the hold releases (withStatusLineRefreshDeferred)
 */
export const setPassageReport = async (input: {
  report: PassageReport;
  route: string;
}): Promise<{ path: string }> => {
  // ensure .route directory found or created
  const routeDir = path.join(input.route, '.route');
  await fs.mkdir(routeDir, { recursive: true });

  // findsert gitignore to ensure guard artifacts are ignored
  await findsertRouteGitignore({ route: input.route });

  // append report as JSON line
  const passagePath = path.join(routeDir, 'passage.jsonl');
  await fs.appendFile(passagePath, JSON.stringify(input.report) + '\n');

  // refresh the status file the status line reads
  await setRouteStatusLineFileOrWarn({
    route: input.route,
    pointerAuthority: 'flag',
  });

  return { path: passagePath };
};
