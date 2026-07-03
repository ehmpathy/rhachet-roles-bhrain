/**
 * .what = checks if a file path matches a negative glob pattern
 * .why = drives --paths-wout exclusion as a named transformer, so the
 *        orchestrator stays narrative and the match logic stays testable
 *
 * .note = three match modes, in order:
 *   - exact: file path equals the pattern
 *   - suffix: pattern names a final path segment (e.g. "secret.ts")
 *   - wildcard: pattern has * or ?, translated to an anchored regex
 */
export const isPathMatchedByGlob = (input: {
  path: string;
  glob: string;
}): boolean => {
  const { path: filePath, glob } = input;

  // exact path match
  if (filePath === glob) return true;

  // suffix match: pattern names a final segment of the path
  if (filePath.endsWith(`/${glob}`)) return true;

  // wildcard match: translate glob wildcards to an anchored regex
  if (glob.includes('*') || glob.includes('?')) {
    const source = glob.replace(/\*/g, '.*').replace(/\?/g, '.');
    return new RegExp(`^${source}$`).test(filePath);
  }

  return false;
};
