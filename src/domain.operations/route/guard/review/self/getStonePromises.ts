import * as fs from 'fs/promises';
import * as path from 'path';

import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { RouteStoneGuardReviewSelfArtifact } from '@src/domain.objects/Driver/RouteStoneGuardReviewSelfArtifact';
import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

/**
 * .what = retrieves promise artifacts for a stone
 * .why = enables check of which self-reviews have been promised
 *
 * .note = all promises are hashless (firm checkpoints that don't invalidate)
 */
export const getStonePromises = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<RouteStoneGuardReviewSelfArtifact[]> => {
  const routeDir = path.join(input.route, '.route');

  // check if .route dir found
  try {
    await fs.access(routeDir);
  } catch {
    return [];
  }

  // glob for promises: $stone.guard.promise.$slug.md
  const promiseGlob = `${input.stone.name}.guard.promise.*.md`;
  const promiseFiles = await enumFilesFromGlob({
    glob: promiseGlob,
    cwd: routeDir,
  });

  // parse promise files
  const promises: RouteStoneGuardReviewSelfArtifact[] = [];
  for (const filePath of promiseFiles) {
    const filename = path.basename(filePath);
    // pattern: *.guard.promise.{slug}.md
    const slug = parsePromiseSlug(filename);
    if (slug) {
      promises.push(
        new RouteStoneGuardReviewSelfArtifact({
          stone: { path: input.stone.path },
          hash: 'hashless',
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
const parsePromiseSlug = (filename: string): string | null => {
  // filename pattern: $stone.guard.promise.$slug.md
  const match = filename.match(/\.guard\.promise\.([^.]+)\.md$/);
  return match?.[1] ?? null;
};
