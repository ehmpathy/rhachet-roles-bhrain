import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * .what = get trigger mtimes from .since and .uptil marker files
 * .why = enables elapsed time calculation and rush detection via mtime comparison
 */
export const getSelfReviewTriggeredReport = async (input: {
  stone: string;
  slug: string;
  hash: string;
  route: string;
}): Promise<{ sinceMtime: Date; uptilMtime: Date } | null> => {
  // compute marker file paths
  const baseFilename = `${input.stone}.guard.selfreview.${input.slug}.${input.hash}.triggered`;
  const sincePath = path.join(input.route, '.route', `${baseFilename}.since`);
  const uptilPath = path.join(input.route, '.route', `${baseFilename}.uptil`);

  // read .since file stat to get mtime
  try {
    const sinceStat = await fs.stat(sincePath);
    // try to read .uptil, fallback to .since mtime if absent
    const uptilStat = await fs
      .stat(uptilPath)
      .catch(() => ({ mtime: sinceStat.mtime }));
    return {
      sinceMtime: sinceStat.mtime,
      uptilMtime: uptilStat.mtime,
    };
  } catch {
    // .since file absent
    return null;
  }
};
