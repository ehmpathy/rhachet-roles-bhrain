import * as path from 'path';

import { getOneGuardProvenance } from '@src/domain.operations/getOneGuardProvenance';
import { asDependencyManifestParseFault } from '@src/domain.operations/review/asDependencyManifestParseFault';
import { asReviewRunIdentity } from '@src/domain.operations/review/asReviewRunIdentity';
import { asPathAbsoluteFromCwd } from '@src/utils/asPathAbsoluteFromCwd';
import { getOneFileTextOrNull } from '@src/utils/fs/getOneFileTextOrNull';

/**
 * .what = where the guard that ran this review was stamped from, and the repo that owns it
 * .why = an overflow refusal from a route-driven lane owes more than a local fix: the lane's
 *        bind came from a template, so every route stamped from it inherits the same overflow.
 *        a cut that applies generically is dispatched upstream, to the template's owner
 *        (seed S33) — and this is how the refusal knows who that owner is
 */
export interface ReviewGuardProvenance {
  /** the lane's slug, as the guard declared it — what an upstream task names */
  slug: string;
  /** the guard file that declared this lane, relative to cwd */
  guard: string;
  /** the guard's `provenance.uri` — the template it was stamped from */
  uri: string;
  /** `owner/name` of the repo that ships the template; null when it cannot be read */
  repo: string | null;
}

/**
 * .what = the package a `node_modules/...` uri points into, scoped names included
 * .why = a template shipped in a dependency is owned by that dependency's repo
 */
const asPackageOfUri = (input: { uri: string }): string | null => {
  const found = /(?:^|\/)node_modules\/((?:@[^/]+\/)?[^/]+)\//.exec(input.uri);
  return found?.[1] ?? null;
};

/**
 * .what = `owner/name` from a package.json `repository` field, in any of its shapes
 * .why = npm accepts a bare `owner/name`, a `github:` shorthand, or a `{ url }` object; the
 *        dispatch needs one form
 */
const asRepoOfPackageField = (input: {
  repository: unknown;
}): string | null => {
  const raw =
    typeof input.repository === 'string'
      ? input.repository
      : typeof input.repository === 'object' &&
          input.repository !== null &&
          'url' in input.repository &&
          typeof input.repository.url === 'string'
        ? input.repository.url
        : null;
  if (raw === null) return null;
  const fromUrl = /github\.com[/:]([^/]+\/[^/#]+?)(?:\.git)?(?:#.*)?$/.exec(
    raw,
  );
  if (fromUrl) return fromUrl[1] ?? null;
  const fromShort = /^(?:github:)?([\w.-]+\/[\w.-]+)$/.exec(raw);
  return fromShort?.[1] ?? null;
};

/**
 * .what = the `repository` field of a dependency's package.json
 * .why = a torn manifest must name its file and class, never surface as a bare
 *        SyntaxError (rule.require.failloud)
 *
 * .note = a dependency's package.json is a third-party shape; the cast claims only
 *         `unknown`, and asRepoOfPackageField validates every form `repository` may take
 */
const asManifestRepositoryField = (input: {
  manifest: string;
  path: string;
}): unknown => {
  try {
    return (JSON.parse(input.manifest) as { repository?: unknown }).repository;
  } catch (error) {
    // only a torn manifest is renamed; any other throw surfaces as itself
    throw asDependencyManifestParseFault({ error, path: input.path });
  }
};

/**
 * .what = reads the provenance of the guard that ran this review, from the review's own output path
 * .why = the guard writes each lane's report into `$route/.reviews/peer/<stone>…`, so the
 *        output path alone names the route and the stone — and so the guard file, and so its
 *        `provenance.uri`. no flag or env var is threaded for it
 *
 * .note = null for a review no guard ran, a guard with no provenance block (a route-local
 *         guard is its own source; there is no upstream), or a guard file no longer on disk
 */
export const getOneReviewGuardProvenance = async (input: {
  output: string;
  cwd: string;
}): Promise<ReviewGuardProvenance | null> => {
  // recover the route + stone the guard wrote this report for
  const identity = asReviewRunIdentity({ output: input.output });
  if (!identity?.route) return null;

  // read that stone's guard, and its lineage
  const guardAbsolute = path.join(
    asPathAbsoluteFromCwd({ path: identity.route, cwd: input.cwd }),
    `${identity.stone}.guard`,
  );
  const guardContent = await getOneFileTextOrNull({ path: guardAbsolute });
  if (guardContent === null) return null;
  const provenance = getOneGuardProvenance({ content: guardContent });
  if (!provenance) return null;

  // name the repo that ships the template, where the uri points into a dependency
  const pkg = asPackageOfUri({ uri: provenance.uri });
  const manifest = pkg
    ? await getOneFileTextOrNull({
        path: path.join(input.cwd, 'node_modules', pkg, 'package.json'),
      })
    : null;
  const repo = manifest
    ? asRepoOfPackageField({
        repository: asManifestRepositoryField({
          manifest,
          path: path.join('node_modules', pkg ?? '', 'package.json'),
        }),
      })
    : null;

  return {
    slug: identity.slug,
    guard: path.relative(input.cwd, guardAbsolute),
    uri: provenance.uri,
    repo,
  };
};
