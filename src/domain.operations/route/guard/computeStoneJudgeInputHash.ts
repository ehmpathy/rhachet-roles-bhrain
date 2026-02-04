import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

/**
 * .what = computes hash of judge inputs (reviews + approvals)
 * .why = judges hash on their inputs for cache lookup
 *
 * judges evaluate reviews and approval state, so their input hash includes:
 * - all review files for the current artifact hash
 * - approval marker presence
 *
 * if reviews change (re-run after fix) or approval is granted, the judge input hash changes.
 */
export const computeStoneJudgeInputHash = async (input: {
  stone: RouteStone;
  reviewInputHash: string;
  route: string;
}): Promise<string> => {
  const routeDir = path.join(input.route, '.route');

  // find all review files for this review input hash
  const reviewGlob = `${input.stone.name}.guard.review.*.${input.reviewInputHash}.*.md`;
  let reviewFiles: string[] = [];
  try {
    reviewFiles = await enumFilesFromGlob({ glob: reviewGlob, cwd: routeDir });
  } catch {
    // .route/ may not exist yet
  }

  // sort for deterministic order
  const sortedReviewFiles = [...reviewFiles].sort();

  // read review contents
  // note: enumFilesFromGlob returns absolute paths, so use directly
  const reviewContents: string[] = [];
  for (const filePath of sortedReviewFiles) {
    const content = await fs.readFile(filePath, 'utf-8');
    // use basename for deterministic hash (absolute paths vary by environment)
    reviewContents.push(`review:${path.basename(filePath)}:${content}`);
  }

  // check approval marker
  const approvalPath = path.join(routeDir, `${input.stone.name}.approved`);
  let approvalExists = false;
  try {
    await fs.access(approvalPath);
    approvalExists = true;
  } catch {
    // no approval marker
  }

  // combine into hash input
  const hashInput = [
    `reviewInputHash:${input.reviewInputHash}`,
    ...reviewContents,
    `approved:${approvalExists}`,
  ].join('\n');

  return crypto.createHash('sha256').update(hashInput).digest('hex');
};
