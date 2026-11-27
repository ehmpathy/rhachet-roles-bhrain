import { readdirSync } from 'fs';
import { join, relative } from 'path';
import { given, then, when } from 'test-fns';

/**
 * .what = every `.seeds` dir found under a root, as paths relative to it
 * .why = a seed dir can hide at any depth of a role (briefs/, a skill dir); the walk finds each
 */
const getAllSeedDirsUnder = (input: { root: string }): string[] => {
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name !== 'node_modules')
      .flatMap((entry) => {
        const path = join(dir, entry.name);
        if (entry.name === '.seeds') return [relative(input.root, path)];
        return walk(path);
      });
  return walk(input.root);
};

/**
 * .what = clamps that no role of this package holds a seed dir
 * .why = a seed is the wisher's words for one route: it lives in that route's `.seeds/`, never
 *        in a role's briefs, so it never ships in the package (librarian
 *        `rule.forbid.seeds-outside-their-route`)
 */
describe('rolesShipNoSeeds', () => {
  given('[case1] the role dirs of this package', () => {
    when('[t0] each is walked for a `.seeds` dir', () => {
      const seedDirs = getAllSeedDirsUnder({ root: __dirname });
      then('none holds one: a seed stays in its route', () => {
        expect(seedDirs).toEqual([]);
      });
    });
  });
});
