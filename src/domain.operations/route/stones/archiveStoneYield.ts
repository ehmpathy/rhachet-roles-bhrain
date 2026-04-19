import * as fs from 'fs/promises';
import * as path from 'path';

import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

/**
 * .what = archive all yield files for a stone to .route/.archive/
 * .why = enables --yield drop to move yields out of the way on rewind
 *
 * .note = uses same glob pattern as getAllStoneArtifacts: ${stone}.yield*
 *         this matches .yield, .yield.md, .yield.json (all variations)
 */
export const archiveStoneYield = async (input: {
  stone: string;
  route: string;
}): Promise<{
  outcome: 'archived' | 'absent';
  count: number;
}> => {
  // enumerate all yield files via extant pattern from getAllStoneArtifacts
  const yieldGlob = `${input.stone}.yield*`;
  const yieldFiles = await enumFilesFromGlob({
    glob: yieldGlob,
    cwd: input.route,
  });

  // if no yield files, return absent
  if (yieldFiles.length === 0) return { outcome: 'absent', count: 0 };

  // ensure archive dir exists
  const archiveDir = path.join(input.route, '.route', '.archive');
  await fs.mkdir(archiveDir, { recursive: true });

  // archive each yield file
  for (const yieldFile of yieldFiles) {
    // yieldFile is absolute path from enumFilesFromGlob
    const baseName = path.basename(yieldFile);

    // compute archive path (collision check + timestamp suffix)
    let archivePath = path.join(archiveDir, baseName);
    const archiveExists = await fs
      .access(archivePath)
      .then(() => true)
      .catch(() => false);
    if (archiveExists) {
      const timestamp = new Date().toJSON().replace(/[:.]/g, '-');
      archivePath = path.join(archiveDir, `${baseName}.${timestamp}`);
    }

    // move file to archive
    await fs.rename(yieldFile, archivePath);
  }

  return { outcome: 'archived', count: yieldFiles.length };
};
