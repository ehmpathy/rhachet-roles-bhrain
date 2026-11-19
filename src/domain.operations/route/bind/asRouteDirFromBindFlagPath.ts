import * as path from 'path';

/**
 * .what = the route dir a bind flag belongs to, relative to the cwd ('.' for the cwd itself)
 * .why = a bind flag sits at `<route>/.route/.bind.<branch>.flag`, so its route is two dirs up;
 *        the bind lookup and the bind write both name the route this way
 */
export const asRouteDirFromBindFlagPath = (input: {
  cwd: string;
  flagPath: string;
}): string =>
  path.relative(input.cwd, path.dirname(path.dirname(input.flagPath))) || '.';
