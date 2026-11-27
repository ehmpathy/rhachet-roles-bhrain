import type { RepoManifest } from './getOneRepoManifest';

/**
 * .what = one role found, in the kind words `init` prints:
 *         `$slug (native)`, `$slug (own)`, or `$slug (linked, $repo)`
 * .why = one vocabulary for the role kind across every surface: a refusal's roles found, and the
 *        role row of `pedigree get` (rule.forbid.ambiguous-labels)
 */
export const asRoleFoundLabel = (input: {
  role: { repo: string; slug: string };
  manifest: RepoManifest | null;
}): string => {
  if (input.role.repo === '.this') return `${input.role.slug} (native)`;
  if (input.role.repo === input.manifest?.slug)
    return `${input.role.slug} (own)`;
  return `${input.role.slug} (linked, ${input.role.repo})`;
};
