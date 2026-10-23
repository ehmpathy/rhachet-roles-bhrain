/**
 * .what = computes claude code project slug from directory path
 * .why = matches claude code's path-to-slug conversion, so every reader of the
 *        projects dir derives one slug from one place
 *
 * claude code transforms paths: / → -, _ → -, . → -
 * e.g., /home/user/_worktrees/repo.branch -> -home-user--worktrees-repo-branch
 *
 * .note = shared at two callers on purpose: the slug is claude code's own rule, a fact of
 *         the domain rather than a duplicated shape; two copies could drift apart, and one
 *         reader would then look in a project dir the other never writes
 */
export const computeProjectSlug = (input: { cwd: string }): string => {
  return input.cwd
    .replace(/\//g, '-') // slashes become dashes
    .replace(/_/g, '-') // underscores become dashes
    .replace(/\./g, '-'); // dots become dashes
};
