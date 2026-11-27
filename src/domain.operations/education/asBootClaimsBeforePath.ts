import * as path from 'path';

/**
 * .what = where a course route keeps the boot claim of each brief its role held at course init
 * .why = course init writes it once and the proof reads it at exit; one name for both
 * .note = a route may be absolute or relative to the repo root; the path returned is absolute
 */
export const asBootClaimsBeforePath = (input: {
  repoRoot: string;
  route: string;
}): string =>
  path.join(
    path.isAbsolute(input.route)
      ? input.route
      : path.join(input.repoRoot, input.route),
    '.boot.before.json',
  );
