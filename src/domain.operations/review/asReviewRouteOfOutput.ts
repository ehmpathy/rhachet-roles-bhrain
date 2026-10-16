import * as path from 'path';

import { asReviewRunIdentity } from '@src/domain.operations/review/asReviewRunIdentity';
import { asPathAbsoluteFromCwd } from '@src/utils/asPathAbsoluteFromCwd';

/**
 * .what = the route a review was driven from, as a path relative to cwd, or null
 * .why = the route's spec rides every partition and is never a suggested cut (seed S31),
 *        and both checks compare it against target paths, which are relative to cwd. the
 *        identity parse returns the route as the output path wrote it, which may be absolute
 */
export const asReviewRouteOfOutput = (input: {
  output: string;
  cwd: string;
}): string | null => {
  const route = asReviewRunIdentity({ output: input.output })?.route ?? null;
  if (!route) return null;
  return path.relative(
    input.cwd,
    asPathAbsoluteFromCwd({ path: route, cwd: input.cwd }),
  );
};
