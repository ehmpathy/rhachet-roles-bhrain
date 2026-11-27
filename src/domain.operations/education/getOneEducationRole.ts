import { ConstraintError } from 'helpful-errors';

import { asRoleFoundLabel } from './asRoleFoundLabel';
import { asSourceDir } from './asSourceDir';
import { getAllAgentRoleLinks } from './getAllAgentRoleLinks';
import { getAllRolesFound } from './getAllRolesFound';
import { getOneRepoManifest, type RepoManifest } from './getOneRepoManifest';
import { getOneSlugNearest } from './getOneSlugNearest';

/**
 * .what = where a pursuit lands, for one role
 * .why = own, linked, and native roles each keep their education in a different home;
 *        one shape lets every later step write without a branch on the kind
 */
export interface EducationRole {
  slug: string;
  kind: 'own' | 'linked' | 'native';
  /** the repo that publishes the role: this repo's slug (own), the package (linked), `.this` (native) */
  repo: string;
  /** the briefs dir the pursuit writes into, repo-relative */
  briefsDir: string;
  /** the skills dir the pursuit writes into, repo-relative */
  skillsDir: string;
  /** the boot spec that names each add, repo-relative */
  bootPath: string;
}

/**
 * .what = whether a role link is the named role, published by a dependency
 * .why = `.this` holds native roles, `.mods` holds rendered views, and this repo's own slug
 *        holds its build links; none of those is a dependency's role
 */
const isRoleLinkedToEducate = (input: {
  link: { repo: string; slug: string };
  slug: string;
  manifest: RepoManifest | null;
}): boolean => {
  if (input.link.slug !== input.slug) return false;
  const reposSkipped = ['.this', '.mods', input.manifest?.slug ?? ''];
  return !reposSkipped.includes(input.link.repo);
};

/**
 * .what = whether a role link is the named role, native to this repo's `.this` dir
 */
const isRoleNativeToEducate = (input: {
  link: { repo: string; slug: string };
  slug: string;
}): boolean => input.link.slug === input.slug && input.link.repo === '.this';

/**
 * .what = look up where a pursuit for this role lands
 * .why = the order is own → linked → native, so a repo that publishes a role educates its
 *        source, never a mod over its own build output
 * .note = refuses (ConstraintError) when no role of that slug is found, with the roles listed
 */
export const getOneEducationRole = (input: {
  repoRoot: string;
  slug: string;
}): EducationRole => {
  const manifest = getOneRepoManifest({ repoRoot: input.repoRoot });

  // own: this repo publishes the role
  const roleOwn = manifest?.roles?.find((role) => role.slug === input.slug);
  if (roleOwn) {
    const briefsDir = asSourceDir({ dirs: roleOwn.briefs?.dirs ?? null });
    const skillsDir = asSourceDir({ dirs: roleOwn.skills?.dirs ?? null });
    const bootPath = asSourceDir({ dirs: roleOwn.boot ?? null });
    const keysAbsent = [
      briefsDir ? null : 'briefs.dirs',
      skillsDir ? null : 'skills.dirs',
      bootPath ? null : 'boot',
    ].filter((key): key is string => key !== null);
    if (!briefsDir || !skillsDir || !bootPath)
      throw new ConstraintError(
        `role ${input.slug} in rhachet.repo.yml lacks a briefs dir, a skills dir, or a boot spec`,
        {
          slug: input.slug,
          keysAbsent,
          hint: `declare ${keysAbsent.join(', ')} on the role's definition, then rebuild (npm run build), which regenerates rhachet.repo.yml from it; an empty list (\`[]\`) holds no dir, so a role with none has naught for a course to write into`,
        },
      );
    return {
      slug: input.slug,
      kind: 'own',
      repo: manifest?.slug ?? '.this',
      briefsDir,
      skillsDir,
      bootPath,
    };
  }

  // linked: a dependency publishes it; this repo's own links and the mods dir are skipped
  const links = getAllAgentRoleLinks({ repoRoot: input.repoRoot });
  const roleLinked = links.find((link) =>
    isRoleLinkedToEducate({ link, slug: input.slug, manifest }),
  );
  if (roleLinked) {
    const modDir = `.agent/repo=.mods/role=${input.slug}`;
    return {
      slug: input.slug,
      kind: 'linked',
      repo: roleLinked.repo,
      briefsDir: `${modDir}/briefs`,
      skillsDir: `${modDir}/skills`,
      bootPath: `${modDir}/boot.yml`,
    };
  }

  // native: the role lives in this repo's .this dir
  const roleNative = links.find((link) =>
    isRoleNativeToEducate({ link, slug: input.slug }),
  );
  if (roleNative) {
    const nativeDir = `.agent/repo=.this/role=${input.slug}`;
    return {
      slug: input.slug,
      kind: 'native',
      repo: '.this',
      briefsDir: `${nativeDir}/briefs`,
      skillsDir: `${nativeDir}/skills`,
      bootPath: `${nativeDir}/boot.yml`,
    };
  }

  // unknown: refuse, with every role found
  const rolesFound = getAllRolesFound({ manifest, links });
  const nearest = getOneSlugNearest({
    slug: input.slug,
    candidates: rolesFound.map((role) => role.slug),
  });
  throw new ConstraintError(`no role ${input.slug} in this repo`, {
    role: input.slug,
    rolesFound: rolesFound.map((role) => asRoleFoundLabel({ role, manifest })),
    hint: nearest
      ? `did you mean --for ${nearest}?`
      : 'pass --for as one of the roles found',
  });
};
