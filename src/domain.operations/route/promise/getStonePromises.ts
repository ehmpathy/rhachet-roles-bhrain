import * as fs from 'fs/promises';
import * as path from 'path';

import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { RouteStoneGuardReviewSelfArtifact } from '@src/domain.objects/Driver/RouteStoneGuardReviewSelfArtifact';
import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

/**
 * .what = retrieves valid promise artifacts for a specific hash
 * .why = enables check of which self-reviews have been promised for current artifact state
 */
export const getStonePromises = async (input: {
  stone: RouteStone;
  hash: string;
  route: string;
}): Promise<RouteStoneGuardReviewSelfArtifact[]> => {
  const routeDir = path.join(input.route, '.route');

  // check if .route dir found
  try {
    await fs.access(routeDir);
  } catch {
    return [];
  }

  // glob for promise files: $stone.guard.promise.$slug.$hash.md
  const promiseGlob = `${input.stone.name}.guard.promise.*.${input.hash}.md`;
  const promiseFiles = await enumFilesFromGlob({
    glob: promiseGlob,
    cwd: routeDir,
  });

  // parse promise files into artifacts
  const promises: RouteStoneGuardReviewSelfArtifact[] = [];
  for (const filePath of promiseFiles) {
    const slug = parsePromiseSlug(filePath);
    if (slug) {
      promises.push(
        new RouteStoneGuardReviewSelfArtifact({
          stone: { path: input.stone.path },
          hash: input.hash,
          slug,
          path: filePath,
        }),
      );
    }
  }

  return promises;
};

/**
 * .what = parses promise slug from filename
 * .why = extracts slug from promise artifact filename pattern
 */
const parsePromiseSlug = (filePath: string): string | null => {
  // filename pattern: $stone.guard.promise.$slug.$hash.md
  const filename = path.basename(filePath);
  const match = filename.match(/\.guard\.promise\.([^.]+)\.[^.]+\.md$/);
  return match?.[1] ?? null;
};

/**
 * .what = checks if a slug has invalidated promises (different hash)
 * .why = enables detection of hash changes that invalidate prior self-review promises
 */
export const hasInvalidatedPromise = async (input: {
  stone: RouteStone;
  slug: string;
  currentHash: string;
  route: string;
}): Promise<boolean> => {
  const routeDir = path.join(input.route, '.route');

  // check if .route dir found
  try {
    await fs.access(routeDir);
  } catch {
    return false;
  }

  // glob for promise files with this slug but any hash
  const promiseGlob = `${input.stone.name}.guard.promise.${input.slug}.*.md`;
  const promiseFiles = await enumFilesFromGlob({
    glob: promiseGlob,
    cwd: routeDir,
  });

  // check if any promise has a different hash than current
  for (const filePath of promiseFiles) {
    const filename = path.basename(filePath);
    // extract hash from filename: $stone.guard.promise.$slug.$hash.md
    const match = filename.match(/\.guard\.promise\.[^.]+\.([^.]+)\.md$/);
    const fileHash = match?.[1];
    if (fileHash && fileHash !== input.currentHash) {
      return true;
    }
  }

  return false;
};
