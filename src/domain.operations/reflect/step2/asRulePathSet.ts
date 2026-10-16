import * as path from 'path';

/**
 * .what = the rule paths as a set, each in `path.join` form
 * .why = a stated targetPath is checked for membership; the shared `path.join` form lets
 *        `a//b` and `a/b` match as one path
 */
export const asRulePathSet = (input: { rulePaths: string[] }): Set<string> =>
  new Set(input.rulePaths.map((f) => path.join(f)));
