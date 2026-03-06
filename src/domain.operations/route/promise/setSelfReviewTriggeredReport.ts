import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * .what = write .since marker (on first challenge) and touch .uptil marker (on every challenge)
 * .why = .since mtime records first challenge; .uptil mtime records latest attempt; comparison detects rush
 *
 * .note = sinceOnly option allows setStoneAsPassed to create only .since for time enforcement
 *         without .uptil (which would trigger rush detection on first promise attempt)
 * .note = attempts counter in .since file enables plowthrough detection
 */
export const setSelfReviewTriggeredReport = async (
  input: {
    stone: string;
    slug: string;
    hash: string;
    route: string;
  },
  options?: { sinceOnly?: boolean },
): Promise<{ sincePath: string; uptilPath: string; attempts: number }> => {
  // ensure .route directory found or created
  const routeDir = path.join(input.route, '.route');
  await fs.mkdir(routeDir, { recursive: true });

  // compute marker file paths
  const baseFilename = `${input.stone}.guard.selfreview.${input.slug}.${input.hash}.triggered`;
  const sincePath = path.join(routeDir, `${baseFilename}.since`);
  const uptilPath = path.join(routeDir, `${baseFilename}.uptil`);

  // check if .since file already found (preserve original trigger time via mtime)
  let attempts = 1;
  const sinceFound = await fs
    .access(sincePath)
    .then(() => true)
    .catch(() => false);

  if (sinceFound) {
    // read current attempts and increment
    const content = await fs.readFile(sincePath, 'utf-8');
    const attemptsMatch = content.match(/^attempts:\s*(\d+)/m);
    const currentAttempts = attemptsMatch?.[1]
      ? parseInt(attemptsMatch[1], 10)
      : 1;
    attempts = currentAttempts + 1;

    // update .since with new attempts count, preserve mtime
    const stat = await fs.stat(sincePath);
    const mtime = stat.mtime;
    const newContent = [
      `slug: ${input.slug}`,
      `hash: ${input.hash}`,
      `attempts: ${attempts}`,
    ].join('\n');
    await fs.writeFile(sincePath, newContent);
    await fs.utimes(sincePath, mtime, mtime);
  } else {
    // create .since with attempts: 1
    const content = [
      `slug: ${input.slug}`,
      `hash: ${input.hash}`,
      `attempts: ${attempts}`,
    ].join('\n');
    await fs.writeFile(sincePath, content);
  }

  // touch .uptil unless sinceOnly (updates mtime on every call)
  if (!options?.sinceOnly) {
    const content = [`slug: ${input.slug}`, `hash: ${input.hash}`].join('\n');
    await fs.writeFile(uptilPath, content);
  }

  return { sincePath, uptilPath, attempts };
};
