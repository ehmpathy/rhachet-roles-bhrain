import * as fs from 'fs/promises';
import * as path from 'path';

import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

/**
 * .what = deletes all guard artifacts for a stone
 * .why = enables rewind to clear validation state but preserve the artifact
 */
export const delStoneGuardArtifacts = async (input: {
  stone: string;
  route: string;
}): Promise<{
  reviews: number;
  judges: number;
  promises: number;
  triggers: number;
}> => {
  const routeDir = path.join(input.route, '.route');

  // check if .route dir found
  try {
    await fs.access(routeDir);
  } catch {
    return { reviews: 0, judges: 0, promises: 0, triggers: 0 };
  }

  // glob for review files: $stone.guard.review.*.md
  // note: dot=true to find files even if directory has gitignore
  const reviewFiles = await enumFilesFromGlob({
    glob: `${input.stone}.guard.review.*.md`,
    cwd: routeDir,
    dot: true,
  });

  // glob for judge files: $stone.guard.judge.*.md
  const judgeFiles = await enumFilesFromGlob({
    glob: `${input.stone}.guard.judge.*.md`,
    cwd: routeDir,
    dot: true,
  });

  // glob for promise files: $stone.guard.promise.*.md
  const promiseFiles = await enumFilesFromGlob({
    glob: `${input.stone}.guard.promise.*.md`,
    cwd: routeDir,
    dot: true,
  });

  // glob for triggered files: $stone.guard.selfreview.*.triggered.*.md
  const triggerFiles = await enumFilesFromGlob({
    glob: `${input.stone}.guard.selfreview.*.triggered.*.md`,
    cwd: routeDir,
    dot: true,
  });

  // delete all found files
  const allFiles = [
    ...reviewFiles,
    ...judgeFiles,
    ...promiseFiles,
    ...triggerFiles,
  ];
  for (const filePath of allFiles) {
    await fs.rm(filePath, { force: true });
  }

  return {
    reviews: reviewFiles.length,
    judges: judgeFiles.length,
    promises: promiseFiles.length,
    triggers: triggerFiles.length,
  };
};
