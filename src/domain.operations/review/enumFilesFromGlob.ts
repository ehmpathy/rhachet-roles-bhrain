import fg from 'fast-glob';

/**
 * .what = enumerates files matching a glob pattern
 * .why = supports --rules and --paths inputs for file discovery
 */
export const enumFilesFromGlob = async (input: {
  glob: string | string[];
  cwd?: string;
}): Promise<string[]> => {
  // normalize to array
  const patterns = Array.isArray(input.glob) ? input.glob : [input.glob];

  // separate positive and negative patterns
  const positivePatterns = patterns.filter((p) => !p.startsWith('!'));
  const negativePatterns = patterns
    .filter((p) => p.startsWith('!'))
    .map((p) => p.slice(1)); // remove ! prefix for ignore

  // enumerate files
  const files = await fg(positivePatterns, {
    cwd: input.cwd,
    ignore: negativePatterns,
    onlyFiles: true,
    dot: true, // include dotfiles
  });

  // return sorted, deduplicated paths
  return [...new Set(files)].sort();
};
