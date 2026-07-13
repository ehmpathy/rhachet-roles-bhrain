import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * .what = get trigger mtimes from .since and .uptil marker files, plus attempts count
 * .why = enables elapsed time calculation, rush detection via mtime comparison, and plowthrough detection
 */
export const getSelfReviewTriggeredReport = async (input: {
  stone: string;
  slug: string;
  hash: string;
  route: string;
}): Promise<{
  sinceMtime: Date;
  uptilMtime: Date;
  attempts: number;
} | null> => {
  // compute marker file paths
  const baseFilename = `${input.stone}.guard.selfreview.${input.slug}.${input.hash}.triggered`;
  const sincePath = path.join(input.route, '.route', `${baseFilename}.since`);
  const uptilPath = path.join(input.route, '.route', `${baseFilename}.uptil`);

  // read .since file stat and content to get mtime and attempts
  try {
    const [sinceStat, sinceContent] = await Promise.all([
      fs.stat(sincePath),
      fs.readFile(sincePath, 'utf-8'),
    ]);

    // try to read .uptil, fallback to .since mtime if absent
    const uptilStat = await fs
      .stat(uptilPath)
      .catch(() => ({ mtime: sinceStat.mtime }));

    // parse attempts from content (default 1 if absent)
    const attemptsMatch = sinceContent.match(/^attempts:\s*(\d+)/m);
    const attempts = attemptsMatch?.[1] ? parseInt(attemptsMatch[1], 10) : 1;

    return {
      sinceMtime: sinceStat.mtime,
      uptilMtime: uptilStat.mtime,
      attempts,
    };
  } catch {
    // .since file absent
    return null;
  }
};
