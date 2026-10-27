import * as fs from 'fs/promises';
import { BadRequestError } from 'helpful-errors';

import { getFsErrorCode } from '@src/utils/fs/getFsErrorCode';

/**
 * .what = writes one stone file, exclusive: a path already taken refuses with the fix
 * .why = the stone add checks for a collision first; a path taken after that scan (a
 *        concurrent add) or that holds no stone file (a dir) must refuse, never overwrite
 *
 * .note = only `EEXIST` maps to the refusal; every other fs fault rethrows as itself
 */
export const setOneStoneFileExclusive = async (input: {
  stone: string;
  stonePath: string;
  content: string;
}): Promise<void> => {
  await fs
    .writeFile(input.stonePath, input.content, { flag: 'wx' })
    .catch((error: unknown) => {
      if (getFsErrorCode(error) !== 'EEXIST') throw error;
      throw new BadRequestError(
        `stone path already taken: ${input.stonePath}; it appeared after the stone scan (a concurrent add) or holds no stone file (a dir); rerun route.stone.add, or remove that path first`,
        { stone: input.stone, path: input.stonePath },
      );
    });
};
