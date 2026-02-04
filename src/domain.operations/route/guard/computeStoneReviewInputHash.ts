import * as crypto from 'crypto';
import * as fs from 'fs/promises';

import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { getAllStoneArtifacts } from '@src/domain.operations/route/stones/getAllStoneArtifacts';

/**
 * .what = computes hash of review inputs (artifacts)
 * .why = reviews hash on their inputs for cache lookup
 *
 * reviews evaluate artifacts, so their input hash is the artifact content hash.
 * same artifact content = same review result (deterministic).
 */
export const computeStoneReviewInputHash = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<string> => {
  // get all artifact files via the reusable operation
  const allFiles = await getAllStoneArtifacts(input);

  // sort deterministically
  const sortedFiles = [...allFiles].sort();

  // read and concatenate content
  const contents: string[] = [];
  for (const filePath of sortedFiles) {
    const content = await fs.readFile(filePath, 'utf-8');
    contents.push(`--- ${filePath} ---\n${content}`);
  }

  // compute hash
  const concatenated = contents.join('\n');
  return crypto.createHash('sha256').update(concatenated).digest('hex');
};
