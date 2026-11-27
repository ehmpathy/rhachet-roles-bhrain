import * as path from 'path';

import { asPedigreeDirsOfRole } from './asPedigreeDirsOfRole';
import { asSourceDir } from './asSourceDir';
import { getOneEducationRole } from './getOneEducationRole';
import { getOneRepoManifest } from './getOneRepoManifest';

/**
 * .what = every dir one role's pedigree is read from, repo-relative; empty where it has none
 * .why = a read needs only the briefs dir. an own role with an empty skills dir or no boot
 *        spec still holds a readable pedigree, and one with no briefs dir holds none; only a
 *        pursuit, which must write all three, refuses those (`getOneEducationRole`). a linked
 *        role reads its shipped entries and its mod's (`asPedigreeDirsOfRole`)
 * .note = an unknown slug still refuses, with roles listed
 */
export const getAllPedigreeDirsOfRole = (input: {
  repoRoot: string;
  slug: string;
}): string[] => {
  // own: read the briefs dir straight from the manifest, the write dirs unasked
  const roleOwn = getOneRepoManifest({ repoRoot: input.repoRoot })?.roles?.find(
    (role) => role.slug === input.slug,
  );
  if (roleOwn) {
    const briefsDir = asSourceDir({ dirs: roleOwn.briefs?.dirs ?? null });
    return briefsDir ? [path.join(briefsDir, 'education')] : [];
  }

  // linked or native: the role lookup names every dir
  return asPedigreeDirsOfRole({
    role: getOneEducationRole({ repoRoot: input.repoRoot, slug: input.slug }),
  });
};
