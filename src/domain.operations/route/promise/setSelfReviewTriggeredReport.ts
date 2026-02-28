import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * .what = write marker file when review.self is first shown
 * .why = file mtime enables time enforcement; content has slug + hash for clarity
 */
export const setSelfReviewTriggeredReport = async (input: {
  stone: string;
  slug: string;
  hash: string;
  route: string;
}): Promise<{ path: string }> => {
  // ensure .route directory found or created
  const routeDir = path.join(input.route, '.route');
  await fs.mkdir(routeDir, { recursive: true });

  // compute marker file path
  const filename = `${input.stone}.guard.selfreview.${input.slug}.${input.hash}.triggered`;
  const filepath = path.join(routeDir, filename);

  // check if file already found (preserve original trigger time via mtime)
  const fileFound = await fs
    .access(filepath)
    .then(() => true)
    .catch(() => false);

  // only write if absent (idempotent)
  if (!fileFound) {
    const content = [`slug: ${input.slug}`, `hash: ${input.hash}`].join('\n');
    await fs.writeFile(filepath, content);
  }

  return { path: filepath };
};
