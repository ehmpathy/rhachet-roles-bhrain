import * as path from 'path';

import { asPathAbsoluteFromCwd } from './asPathAbsoluteFromCwd';

/**
 * .what = the cwd-relative form of a caller's path, whether it was given absolute or relative
 * .why = a glob prefix matches against cwd-relative paths, so an absolute route matches no
 *        file. one name states the cast, and routes it through the one absolute resolution
 *        (asPathAbsoluteFromCwd) rather than a second inline ternary
 */
export const asPathRelativeToCwd = (input: {
  path: string;
  cwd: string;
}): string => path.relative(input.cwd, asPathAbsoluteFromCwd(input));
