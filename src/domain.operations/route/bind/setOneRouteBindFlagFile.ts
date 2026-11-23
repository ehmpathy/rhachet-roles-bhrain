import * as fs from 'fs/promises';
import * as path from 'path';

import { getFsErrorCode } from '@src/utils/fs/getFsErrorCode';

/**
 * .what = writes one bind flag file, exclusive; a flag already there is left as it stands
 * .why = the flag is the bind, and its body names the branch; a concurrent bind of the same
 *        route that wrote it first wrote the same body, so its flag is the idempotent outcome
 *
 * .note = only `EEXIST` is absorbed; every other fs fault rethrows as itself
 */
export const setOneRouteBindFlagFile = async (input: {
  flagPath: string;
  content: string;
}): Promise<void> => {
  await fs.mkdir(path.dirname(input.flagPath), { recursive: true });
  await fs
    .writeFile(input.flagPath, input.content, { flag: 'wx' })
    .catch((error: unknown) => {
      if (getFsErrorCode(error) !== 'EEXIST') throw error;
    });
};
