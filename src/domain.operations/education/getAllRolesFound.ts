import type { RepoManifest } from './getOneRepoManifest';

/**
 * .what = the roles this repo publishes, each tagged with this repo's slug
 */
const asRolesOwn = (input: {
  manifest: RepoManifest | null;
}): Array<{ repo: string; slug: string }> => {
  const repoOwn = input.manifest?.slug ?? '.this';
  return (input.manifest?.roles ?? []).map((role) => ({
    slug: role.slug,
    repo: repoOwn,
  }));
};

/**
 * .what = whether a role link under `.agent/` is a role of its own, apart from this repo's
 * .why = `.mods` holds rendered views and this repo's own slug holds its build links; each
 *        duplicates a role found elsewhere
 */
const isRoleLinkListed = (input: {
  link: { repo: string };
  manifest: RepoManifest | null;
}): boolean => {
  if (input.link.repo === '.mods') return false;
  return input.link.repo !== input.manifest?.slug;
};

/**
 * .what = every role this repo can educate, each with the repo that publishes it
 * .why = one list serves both the refusal of an unknown --for and `pedigree get` over every
 *        role; the `.mods` dir and this repo's own build links are no roles of their own
 * .note = a role may appear twice (published here and linked back); readers that want one
 *         entry per slug dedupe it
 */
export const getAllRolesFound = (input: {
  manifest: RepoManifest | null;
  links: Array<{ repo: string; slug: string }>;
}): Array<{ repo: string; slug: string }> => [
  ...asRolesOwn({ manifest: input.manifest }),
  ...input.links.filter((link) =>
    isRoleLinkListed({ link, manifest: input.manifest }),
  ),
];
