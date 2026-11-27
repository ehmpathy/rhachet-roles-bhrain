import { asRoleFoundLabel } from './asRoleFoundLabel';
import { getAllAgentRoleLinks } from './getAllAgentRoleLinks';
import { getAllRolesFound } from './getAllRolesFound';
import { getOneRepoManifest } from './getOneRepoManifest';

/**
 * .what = one role slug with its kind, as the roles found name it: `mechanic (native)`
 * .why = `pedigree get` names the role kind as `init` and `set` do, and a read never refuses:
 *        a slug the roles found lack reads as the bare slug
 */
export const getOneRoleFoundLabel = (input: {
  repoRoot: string;
  slug: string;
}): string => {
  const manifest = getOneRepoManifest({ repoRoot: input.repoRoot });
  const found = getAllRolesFound({
    manifest,
    links: getAllAgentRoleLinks({ repoRoot: input.repoRoot }),
  }).find((role) => role.slug === input.slug);
  return found ? asRoleFoundLabel({ role: found, manifest }) : input.slug;
};
