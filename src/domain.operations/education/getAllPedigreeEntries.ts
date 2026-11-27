import type { PedigreeEntry } from '@src/domain.objects/Learner/PedigreeEntry';

import { asSlugsDistinct } from './asSlugsDistinct';
import { getAllAgentRoleLinks } from './getAllAgentRoleLinks';
import { getAllPedigreeDirsOfRole } from './getAllPedigreeDirsOfRole';
import { getAllPedigreeEntriesOfRole } from './getAllPedigreeEntriesOfRole';
import { getAllRolesFound } from './getAllRolesFound';
import { getOneRepoManifest } from './getOneRepoManifest';

/**
 * .what = every role slug this repo can educate, each once, in name order
 * .why = a role may be both own and linked; one slug per role keeps `get` from a twin tree
 */
const getAllRoleSlugs = (input: { repoRoot: string }): string[] => {
  const rolesFound = getAllRolesFound({
    manifest: getOneRepoManifest({ repoRoot: input.repoRoot }),
    links: getAllAgentRoleLinks({ repoRoot: input.repoRoot }),
  });
  return asSlugsDistinct({ slugs: rolesFound.map((role) => role.slug) });
};

/**
 * .what = the pedigree of one role, by slug
 * .why = a slug resolves to where the role lands (own, linked, native), and the pedigree lives
 *        beside its briefs there; a linked role adds the entries its publisher shipped, and a
 *        role this repo publishes with no briefs dir holds none
 */
const getOnePedigreeOfRole = (input: {
  repoRoot: string;
  slug: string;
}): { role: string; entries: PedigreeEntry[] } => {
  return {
    role: input.slug,
    entries: getAllPedigreeEntriesOfRole({
      repoRoot: input.repoRoot,
      pedigreeDirs: getAllPedigreeDirsOfRole(input),
      namesOmitted: [],
    }),
  };
};

/**
 * .what = the pedigree of one role, or of every role this repo holds
 * .why = `education.pedigree get`: a director audits what each role was taught
 * .note = every role is listed, even with no entry, so an absence reads plainly; the render
 *         collapses the empty ones into one leaf. an unknown named role is refused (by
 *         getOneEducationRole), with roles listed
 */
export const getAllPedigreeEntries = (input: {
  repoRoot: string;
  role: string | null;
}): Array<{ role: string; entries: PedigreeEntry[] }> => {
  // one named role: its pedigree, empty or not
  if (input.role !== null)
    return [
      getOnePedigreeOfRole({ repoRoot: input.repoRoot, slug: input.role }),
    ];

  // every role, empty or not
  return getAllRoleSlugs({ repoRoot: input.repoRoot }).map((slug) =>
    getOnePedigreeOfRole({ repoRoot: input.repoRoot, slug }),
  );
};
