import * as fs from 'fs/promises';
import * as path from 'path';

import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

/**
 * .what = counts triggered files for a self-review slug across all hashes
 * .why = enables hashbar threshold check and rush detection via mtime comparison
 */
export const getSelfReviewTriggeredCount = async (input: {
  stone: string;
  slug: string;
  route: string;
}): Promise<{
  count: number;
  newest: {
    hash: string;
    sinceMtime: Date;
    uptilMtime: Date;
  } | null;
}> => {
  const routeDir = path.join(input.route, '.route');

  // check if .route dir found
  try {
    await fs.access(routeDir);
  } catch {
    return { count: 0, newest: null };
  }

  // glob for triggered .since files: $stone.guard.selfreview.$slug.*.triggered.since
  const triggeredGlob = `${input.stone}.guard.selfreview.${input.slug}.*.triggered.since`;
  const triggeredFiles = await enumFilesFromGlob({
    glob: triggeredGlob,
    cwd: routeDir,
  });

  // no files found
  if (triggeredFiles.length === 0) {
    return { count: 0, newest: null };
  }

  // find newest triggered pair by .since mtime
  let newest: {
    hash: string;
    sinceMtime: Date;
    uptilMtime: Date;
  } | null = null;

  for (const sincePath of triggeredFiles) {
    // extract hash from filename: $stone.guard.selfreview.$slug.$hash.triggered.since
    const filename = path.basename(sincePath);
    const parts = filename.split('.');
    // parts: [stone, guard, selfreview, slug, hash, triggered, since]
    const hashIndex = parts.length - 3; // hash is 3rd from end
    const hash = parts[hashIndex] ?? '';

    // compute .uptil path from .since path
    const uptilPath = sincePath.replace(/\.since$/, '.uptil');

    // get stats for both files
    const sinceStat = await fs.stat(sincePath);
    const uptilStat = await fs
      .stat(uptilPath)
      .catch(() => ({ mtime: sinceStat.mtime })); // fallback to .since mtime if .uptil absent

    // track newest by .since mtime
    if (!newest || sinceStat.mtime > newest.sinceMtime) {
      newest = {
        hash,
        sinceMtime: sinceStat.mtime,
        uptilMtime: uptilStat.mtime,
      };
    }
  }

  return {
    count: triggeredFiles.length,
    newest,
  };
};
