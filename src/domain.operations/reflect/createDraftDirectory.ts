import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * .what = creates draft directory structure for reflect output
 * .why = organizes pure proposals, manifest, and blended sync output
 */
export const createDraftDirectory = async (input: {
  targetDir: string;
}): Promise<{
  draftDir: string;
  pureDir: string;
  syncDir: string;
}> => {
  // generate timestamp for unique draft directory
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  // create draft directory paths
  const draftDir = path.join(input.targetDir, '.draft', `v${timestamp}`);
  const pureDir = path.join(draftDir, 'pure');
  const syncDir = path.join(draftDir, 'sync');

  // create directories
  await fs.mkdir(pureDir, { recursive: true });
  await fs.mkdir(syncDir, { recursive: true });

  return { draftDir, pureDir, syncDir };
};
