import * as fs from 'fs/promises';

import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

import { isENOENT } from '../isENOENT';

/**
 * .what = enumerates files within a route that match a glob pattern
 * .why = centralizes route file enumeration + ENOENT handle
 *
 * glob is relative to route root, e.g.:
 * - '.route/*.md' for route artifacts
 * - '.reviews/peer/*.md' for peer reviews
 */
export const enumRouteFiles = async (input: {
  route: string;
  glob: string;
  ignore?: string[];
}): Promise<string[]> => {
  try {
    await fs.access(input.route);
    return await enumFilesFromGlob({
      glob: input.glob,
      cwd: input.route,
      ignore: input.ignore,
    });
  } catch (error) {
    if (!isENOENT(error)) throw error;
    return [];
  }
};
