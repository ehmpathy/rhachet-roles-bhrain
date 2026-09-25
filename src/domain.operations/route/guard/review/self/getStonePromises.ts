import * as fs from 'fs/promises';
import * as path from 'path';

import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { RouteStoneGuardReviewSelfArtifact } from '@src/domain.objects/Driver/RouteStoneGuardReviewSelfArtifact';
import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

import {
  asStonePromiseFilenameGlob,
  asStonePromiseSlug,
} from './getStonePromisePaths';

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

  // probe for the .route dir. an ENOENT is the real absence — no stone has been driven yet, so
  // there are no promises. every OTHER error is a fault, and a fault must reach the caller.
  //
  // 🔴 .note = a bare `catch { return [] }` sat here until i011, and its blast radius is the
  //            whole gate: an EACCES or an EIO read as "no promises on record", so the guard
  //            RE-HANDS every review the driver already promised — the exact silent-drop failure
  //            the `parsePromiseSlug` note below records, entered from one level up
  //            (rule.forbid.failhide). found by a peer lane at i011.
  const routeDirFound = await fs
    .access(routeDir)
    .then(() => true)
    .catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return false;
      throw error;
    });
  if (!routeDirFound) return [];

  // glob for promises: $stone.guard.promise.$slug.md
  const promiseFiles = await enumFilesFromGlob({
    glob: asStonePromiseFilenameGlob({ stone: input.stone.name }),
    cwd: routeDir,
  });

  // parse promise files
  const promises: RouteStoneGuardReviewSelfArtifact[] = [];
  for (const filePath of promiseFiles) {
    const filename = path.basename(filePath);
    // pattern: *.guard.promise.{slug}.md
    const slug = asStonePromiseSlug({ filename });
    if (slug) {
      promises.push(
        new RouteStoneGuardReviewSelfArtifact({
          stone: { path: input.stone.path },
          slug,
          path: filePath,
        }),
      );
    }
  }

  return promises;
};
