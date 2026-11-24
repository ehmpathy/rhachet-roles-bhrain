import * as path from 'path';

import { isPathWithinRoot } from '../isPathWithinRoot';

/**
 * .what = the focus route as a human reads it — relative to the repo root when it sits inside it
 * .why = the focus is stored absolute (one canonical form for every reader), but a human who runs
 *        `route.reminder.get` thinks in `.behavior/<route>`, the form `route.bind.set` takes. a
 *        route outside the repo root keeps its absolute path, so the label never lies about where
 *        the route is
 *
 * .note = a route that IS the repo root renders `.`, never an empty label — the same norm the
 *         drive's own route render holds (asRouteDisplayPath)
 */
export const asRouteReminderFocusLabel = (input: {
  repoRoot: string;
  route: string;
}): string => {
  if (
    !isPathWithinRoot({ pathResolved: input.route, repoRoot: input.repoRoot })
  )
    return input.route;
  return path.relative(input.repoRoot, input.route) || '.';
};
