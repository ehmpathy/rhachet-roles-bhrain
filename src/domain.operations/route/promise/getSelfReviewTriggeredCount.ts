import * as fs from 'fs/promises';
import * as path from 'path';

import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

/**
 * .what = counts triggered files for a self-review slug across all hashes
 * .why = enables hashbar threshold check for hashless promises
 */
export const getSelfReviewTriggeredCount = async (input: {
  stone: string;
  slug: string;
  route: string;
}): Promise<{ count: number; newestMtime: Date | null }> => {
  const routeDir = path.join(input.route, '.route');

  // check if .route dir found
  try {
    await fs.access(routeDir);
  } catch {
    return { count: 0, newestMtime: null };
  }

  // glob for triggered files: $stone.guard.selfreview.$slug.*.triggered
  const triggeredGlob = `${input.stone}.guard.selfreview.${input.slug}.*.triggered`;
  const triggeredFiles = await enumFilesFromGlob({
    glob: triggeredGlob,
    cwd: routeDir,
  });

  // no files found
  if (triggeredFiles.length === 0) {
    return { count: 0, newestMtime: null };
  }

  // find newest mtime across all triggered files
  // note: enumFilesFromGlob returns absolute paths
  let newestMtime: Date | null = null;
  for (const filePath of triggeredFiles) {
    const stat = await fs.stat(filePath);
    if (!newestMtime || stat.mtime > newestMtime) {
      newestMtime = stat.mtime;
    }
  }

  return {
    count: triggeredFiles.length,
    newestMtime,
  };
};
