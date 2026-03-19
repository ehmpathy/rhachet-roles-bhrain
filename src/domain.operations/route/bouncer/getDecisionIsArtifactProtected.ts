import type {
  RouteBouncerCache,
  RouteBouncerProtection,
} from '@src/domain.objects/Driver';

/**
 * .what = converts glob pattern to regex
 * .why = enables glob match without external dependencies
 *
 * supports:
 * - **\/ (zero or more directories)
 * - * (single segment match)
 * - ? (single character match)
 * - literal characters
 */
const globToRegex = (glob: string): RegExp => {
  const escaped = glob
    // escape regex special chars (except * and ?)
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    // convert **/ to placeholder for "zero or more directories"
    .replace(/\*\*\//g, '{{GLOBSTAR_SLASH}}')
    // convert standalone ** to placeholder for "any path"
    .replace(/\*\*/g, '{{GLOBSTAR}}')
    // convert * to segment match (no /)
    .replace(/\*/g, '[^/]*')
    // convert ? to char match
    .replace(/\?/g, '.')
    // convert **/ placeholder to optional path segments
    .replace(/\{\{GLOBSTAR_SLASH\}\}/g, '(.*/)?')
    // convert standalone ** to any path
    .replace(/\{\{GLOBSTAR\}\}/g, '.*');

  return new RegExp(`^${escaped}$`);
};

/**
 * .what = checks if a path is protected by any unpassed stone
 * .why = enables fast artifact gate enforcement via precomputed cache
 */
export const getDecisionIsArtifactProtected = (input: {
  path: string;
  cache: RouteBouncerCache;
}): { blocked: boolean; protection: RouteBouncerProtection | null } => {
  // check each protection that hasn't passed
  for (const protection of input.cache.protections) {
    // skip protections for passed stones
    if (protection.passed) continue;

    // check if path matches glob
    const regex = globToRegex(protection.glob);
    if (regex.test(input.path)) {
      return { blocked: true, protection };
    }
  }

  // no active protection found
  return { blocked: false, protection: null };
};
