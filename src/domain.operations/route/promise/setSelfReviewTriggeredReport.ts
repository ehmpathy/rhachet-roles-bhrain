import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * .what = write .since marker (on first challenge) and touch .uptil marker (on every challenge)
 * .why = .since mtime records first challenge; .uptil mtime records latest attempt; comparison detects rush
 *
 * .note = sinceOnly option allows setStoneAsPassed to create only .since for time enforcement
 *         without .uptil (which would trigger rush detection on first promise attempt)
 */
export const setSelfReviewTriggeredReport = async (
  input: {
    stone: string;
    slug: string;
    hash: string;
    route: string;
  },
  options?: { sinceOnly?: boolean },
): Promise<{ sincePath: string; uptilPath: string }> => {
  // ensure .route directory found or created
  const routeDir = path.join(input.route, '.route');
  await fs.mkdir(routeDir, { recursive: true });

  // compute marker file paths
  const baseFilename = `${input.stone}.guard.selfreview.${input.slug}.${input.hash}.triggered`;
  const sincePath = path.join(routeDir, `${baseFilename}.since`);
  const uptilPath = path.join(routeDir, `${baseFilename}.uptil`);

  // check if .since file already found (preserve original trigger time via mtime)
  const sinceFound = await fs
    .access(sincePath)
    .then(() => true)
    .catch(() => false);

  // only write .since if absent (idempotent, preserves first challenge mtime)
  if (!sinceFound) {
    const content = [`slug: ${input.slug}`, `hash: ${input.hash}`].join('\n');
    await fs.writeFile(sincePath, content);
  }

  // touch .uptil unless sinceOnly (updates mtime on every call)
  if (!options?.sinceOnly) {
    const content = [`slug: ${input.slug}`, `hash: ${input.hash}`].join('\n');
    await fs.writeFile(uptilPath, content);
  }

  return { sincePath, uptilPath };
};
