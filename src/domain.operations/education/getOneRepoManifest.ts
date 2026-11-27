import { existsSync, readFileSync } from 'fs';
import { ConstraintError } from 'helpful-errors';
import * as path from 'path';

// note: js-yaml ships no types in this repo; the require form is the repo's convention (setGoal.ts)
const yaml = require('js-yaml');

/**
 * .what = the slice of rhachet.repo.yml the education ops read
 * .note = each field is optional because the file is rhachet's, not ours: a repo may
 *         publish no roles, and a role may omit a dir
 */
export interface RepoManifest {
  slug?: string;
  roles?: Array<{
    slug: string;
    briefs?: { dirs?: string | string[] };
    skills?: { dirs?: string | string[] };
    boot?: string;
  }>;
}

/**
 * .what = whether a parsed yaml value has the manifest's shape where the suite reads it
 * .why = js-yaml returns an untyped value; a check here keeps a malformed file from a crash
 *        deep in a role lookup (rule.require.shapefit)
 */
const isRepoManifest = (input: {
  value: unknown;
}): input is {
  value: RepoManifest;
} => {
  const { value } = input;
  if (typeof value !== 'object' || value === null) return false;
  if (!('roles' in value) || value.roles === undefined) return true;
  return (
    Array.isArray(value.roles) &&
    value.roles.every(
      (role: unknown) =>
        typeof role === 'object' &&
        role !== null &&
        'slug' in role &&
        typeof role.slug === 'string',
    )
  );
};

/**
 * .what = the manifest's yaml, loaded but unread
 * .why = a syntax fault is a file the caller must repair, so it refuses as a ConstraintError
 *        (exit 2) with the file and the parser's cause, never as a raw malfunction
 */
const asManifestYamlLoaded = (input: { manifestPath: string }): unknown => {
  try {
    return yaml.load(readFileSync(input.manifestPath, 'utf-8'));
  } catch (error) {
    // allowlist: a yaml syntax fault is the caller's to repair; every other fault throws as is
    if (!(error instanceof yaml.YAMLException) || !(error instanceof Error))
      throw error;
    throw new ConstraintError('rhachet.repo.yml is not valid yaml', {
      manifestPath: input.manifestPath,
      parserSays: error.message,
      hint: 'repair the yaml at the line the parser names',
    });
  }
};

/**
 * .what = read rhachet.repo.yml, or null when the repo publishes no roles
 * .why = it names the roles this repo owns, and where each one's source lives
 */
export const getOneRepoManifest = (input: {
  repoRoot: string;
}): RepoManifest | null => {
  const manifestPath = path.join(input.repoRoot, 'rhachet.repo.yml');
  if (!existsSync(manifestPath)) return null;
  const parsed = { value: asManifestYamlLoaded({ manifestPath }) };
  if (!isRepoManifest(parsed))
    throw new ConstraintError(
      'rhachet.repo.yml has no shape to read roles from',
      {
        manifestPath,
        hint: 'roles must be a list, each with a string slug',
      },
    );
  return parsed.value;
};
