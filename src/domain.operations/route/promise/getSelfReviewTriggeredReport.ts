import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * .what = get trigger time from marker file mtime
 * .why = enables elapsed time calculation for enforcement
 */
export const getSelfReviewTriggeredReport = async (input: {
  stone: string;
  slug: string;
  hash: string;
  route: string;
}): Promise<{ mtime: Date } | null> => {
  // compute marker file path
  const filename = `${input.stone}.guard.selfreview.${input.slug}.${input.hash}.triggered`;
  const filepath = path.join(input.route, '.route', filename);

  // read file stat to get mtime
  try {
    const stat = await fs.stat(filepath);
    return { mtime: stat.mtime };
  } catch {
    // file absent
    return null;
  }
};
