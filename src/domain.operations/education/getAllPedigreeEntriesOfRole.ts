import { existsSync, readdirSync, readFileSync } from 'fs';
import { ConstraintError } from 'helpful-errors';
import * as path from 'path';

import type { PedigreeEntry } from '@src/domain.objects/Learner/PedigreeEntry';

import { asPedigreeEntryParsed } from './asPedigreeEntryParsed';
import { isPedigreeEntryName } from './isPedigreeEntryName';

/**
 * .what = every pedigree entry file name in a dir, oldest first (the date leads the name)
 */
const getAllPedigreeEntryNames = (input: { dir: string }): string[] =>
  readdirSync(input.dir)
    .filter((name) => isPedigreeEntryName({ name }))
    .sort();

/**
 * .what = one pedigree entry, read and parsed; refuses an entry-named file that will not parse
 * .why = a file named `pedigree.pursuit=…md` is meant as an entry, so a parse fault is a record
 *        at risk: `set` rebuilds the index from what this reads, and a silent skip would drop
 *        the row for good. the name filter already leaves a hand note out
 */
const getOnePedigreeEntryOfFile = (input: {
  repoRoot: string;
  dir: string;
  name: string;
}): PedigreeEntry => {
  const entryPath = path.join(input.dir, input.name);
  const entry = asPedigreeEntryParsed({
    markdown: readFileSync(entryPath, 'utf-8'),
  });
  if (!entry)
    throw new ConstraintError('a pedigree entry does not parse', {
      entryPath: path.relative(input.repoRoot, entryPath),
      hint: 'restore its title and courses table, or re-stamp it: rhx education.pedigree set --from <its pursuit route>',
    });
  return entry;
};

/**
 * .what = each entry file name a role holds, once, with the dir that holds it; a later dir wins
 * .why = a linked role holds the entries its publisher shipped in its rendered view and its own
 *        in the mod; a render copies the mod's into the view, so one name may stand in both
 */
const getAllPedigreeEntrySites = (input: {
  repoRoot: string;
  pedigreeDirs: string[];
}): Array<{ dir: string; name: string }> => {
  const siteOfName = new Map<string, string>(
    input.pedigreeDirs
      .map((pedigreeDir) => path.join(input.repoRoot, pedigreeDir))
      .filter((dir) => existsSync(dir))
      .flatMap((dir) =>
        getAllPedigreeEntryNames({ dir }).map((name): [string, string] => [
          name,
          dir,
        ]),
      ),
  );
  return [...siteOfName.entries()]
    .map(([name, dir]) => ({ dir, name }))
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
};

/**
 * .what = every pedigree entry one role holds, oldest first
 * .why = the read half of the pedigree; `get` renders it and `set` rebuilds the index from it
 * .note = `pedigreeDirs` are read in order, an entry name once, the last dir to hold it wins:
 *         a linked role passes its rendered view, then its mod (`asPedigreeDirsOfRole`)
 * .note = `namesOmitted` leaves out entries by file name: `set` reads the siblings of the entry
 *         it is about to rewrite, so a damaged prior copy of that one entry never blocks it
 */
export const getAllPedigreeEntriesOfRole = (input: {
  repoRoot: string;
  /** the role's pedigree dirs, repo-relative (`asPedigreeDirsOfRole`, or `getAllPedigreeDirsOfRole` on a read) */
  pedigreeDirs: string[];
  namesOmitted: string[];
}): PedigreeEntry[] =>
  getAllPedigreeEntrySites(input)
    .filter((site) => !input.namesOmitted.includes(site.name))
    .map((site) =>
      getOnePedigreeEntryOfFile({ repoRoot: input.repoRoot, ...site }),
    );
