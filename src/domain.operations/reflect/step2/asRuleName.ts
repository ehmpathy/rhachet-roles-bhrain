import * as path from 'path';

/**
 * .what = extracts rule name from a file path
 * .why = enables match of rules by name across different directory structures
 *
 * .note = handles paths like "practices/rule.require.arrow-functions.md" and
 *         maps underscores to hyphens for fuzzy match
 */
export const asRuleName = (input: { rulePath: string }): string => {
  const basename = path.basename(input.rulePath);

  // underscores read as hyphens, case ignored
  return basename.replace(/_/g, '-').toLowerCase();
};
