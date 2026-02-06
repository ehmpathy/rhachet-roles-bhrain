import fg from 'fast-glob';

/**
 * .what = enumerates files that match a glob pattern
 * .why = enables consistent file discovery across operations
 */
export const enumFilesFromGlob = async (input: {
  glob: string;
  cwd: string;
  dot?: boolean;
}): Promise<string[]> => {
  const matches = await fg(input.glob, {
    cwd: input.cwd,
    absolute: true,
    onlyFiles: true,
    dot: input.dot,
  });
  return matches;
};
