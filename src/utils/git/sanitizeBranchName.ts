/**
 * .what = converts branch name to filesystem-safe string
 * .why = branches with slashes like "feat/my-feature" would create subdirs
 */
export const sanitizeBranchName = (input: { branch: string }): string => {
  return input.branch
    .replace(/\//g, '.') // slashes to dots (preserves hierarchy readability)
    .replace(/[^a-zA-Z0-9-_.]/g, '-') // other unsafe chars to dashes
    .replace(/[-_.]{2,}/g, (m) => m[0]!) // collapse consecutive special chars
    .replace(/^[-_.]|[-_.]$/g, ''); // trim start/end special chars
};
