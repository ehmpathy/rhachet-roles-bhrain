import * as path from 'path';

/**
 * .what = renders a route path relative to cwd for a drive-message `route = ` line
 * .why = when the route IS the cwd, path.relative yields '' — which would render
 *        `route = ` (empty) and, joined naively, a spurious slash-prefix
 *        (`/blocker/...` reads as an absolute path). this normalizes the empty case
 *        to '.', so every drive message shows one consistent, portable relative path
 *        (rule.require.single-source-of-truth-for-render).
 */
export const asRouteDisplayPath = (input: { route: string }): string =>
  path.relative(process.cwd(), input.route) || '.';
