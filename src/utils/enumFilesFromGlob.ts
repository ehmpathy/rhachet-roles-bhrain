import globby from 'globby';

/**
 * .what = enumerates files that match a glob pattern
 * .why = enables consistent file discovery across operations
 */
export const enumFilesFromGlob = async (input: {
  glob: string;
  cwd: string;
  dot?: boolean;
  ignore?: string[];
}): Promise<string[]> => {
  const matches = await globby(input.glob, {
    cwd: input.cwd,
    absolute: true,
    onlyFiles: true,
    dot: input.dot,
    ignore: input.ignore ?? [], // globby v11 requires array, not undefined
  });
  return matches;
};
