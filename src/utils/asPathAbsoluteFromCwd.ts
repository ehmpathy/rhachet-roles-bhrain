import * as path from 'path';

/**
 * .what = the absolute form of a caller's path, read against the review's cwd
 * .why = stepReview resolved two caller paths with the same inline ternary; one name
 *        states the act and keeps the two resolutions from drift
 */
export const asPathAbsoluteFromCwd = (input: {
  path: string;
  cwd: string;
}): string =>
  path.isAbsolute(input.path) ? input.path : path.join(input.cwd, input.path);
