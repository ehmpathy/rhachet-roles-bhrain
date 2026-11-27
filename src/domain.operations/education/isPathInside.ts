import * as path from 'path';

/**
 * .what = whether a path sits within (or at) a dir
 * .why = a relative path whose first segment is `..` leaves the dir, but a name such as
 *        `..notes` stays inside; a test of the first segment, never the first two chars,
 *        parts the two
 */
export const isPathInside = (input: { dir: string; path: string }): boolean => {
  const relative = path.relative(input.dir, input.path);
  if (path.isAbsolute(relative)) return false;
  return relative.split(path.sep)[0] !== '..';
};
