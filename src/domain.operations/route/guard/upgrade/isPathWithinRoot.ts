import * as path from 'path';

/**
 * .what = PURE containment check — is a pre-resolved absolute path inside repoRoot?
 * .why = a guard's `provenance.uri` must never point outside the repo (a hostile
 *   `../../etc/passwd` could leak bytes into plan output or overwrite a tracked file).
 *   the orchestrator does the impure `path.join` + `fs.realpath` (symlink-hardened),
 *   then hands the resolved path here for a string-only containment test.
 *
 * .note = an escape (rel starts with `..`, or is absolute on a different root) yields
 *   false; the orchestrator then fails loud (ConstraintError, exit 2) before any read.
 */
export const isPathWithinRoot = (input: {
  pathResolved: string;
  repoRoot: string;
}): boolean => {
  const rel = path.relative(input.repoRoot, input.pathResolved);
  return !rel.startsWith('..') && !path.isAbsolute(rel);
};
