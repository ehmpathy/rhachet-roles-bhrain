import * as crypto from 'crypto';
import * as path from 'path';
import { isPresent } from 'type-fns';

import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { getAllResultsInBoundedPool } from '@src/utils/getAllResultsInBoundedPool';

import { enumRouteGuardReviewPeerFiles } from '../guard/review/peer/enumRouteGuardReviewPeerFiles';
import { getAllLatestReviewFilesPerIndex } from '../guard/review/peer/getAllLatestReviewFilesPerIndex';
import { getOneReviewArtifactContent } from '../guard/review/peer/getOneReviewArtifactContent';
import { getOnePassageReport } from '../passage/getOnePassageReport';

/**
 * .what = how many review file reads may be in flight at one time
 * .why = the review files of a stone grow with every iteration, so an unbounded fan-out opens
 *        one descriptor per file. the bound holds the open reads at a fixed count, as
 *        `getAllPeerGivenVerdictsFromFiles` does for the same reads
 */
const BOUND_OF_CONCURRENT_REVIEW_READS = 8;

/**
 * .what = gets the hash of judge inputs (reviews + approvals)
 * .why = judges hash on their inputs for cache lookup
 *
 * judges evaluate reviews and approval state, so their input hash includes:
 * - all review files for the current artifact hash
 * - approval marker presence
 *
 * if reviews change (re-run after fix) or approval is granted, the judge input hash changes.
 *
 * .note = a `get*` retrieval, never a `compute*` transformer: it reads the disk (the review
 *         files and the passage ledger), so its grain is a composer of named reads
 *         (define.domain-operation-core-variants)
 */
export const getOneStoneJudgeInputHash = async (input: {
  stone: RouteStone;
  reviewInputHash: string;
  route: string;
}): Promise<string> => {
  // find all review files for this review input hash
  // review pattern: $stone._.review.i$iter.$hash.r$idx._.given.by_peer.$slug.md
  const reviewFiles = await enumRouteGuardReviewPeerFiles({
    route: input.route,
    stone: input.stone.name,
    hash: input.reviewInputHash,
  });

  // get latest review per index (later iterations supersede earlier)
  const latestReviewFiles = getAllLatestReviewFilesPerIndex({ reviewFiles });

  // read each latest review as a tagged hash line, bounded, in the sorted input order
  const reviewContents = (
    await getAllResultsInBoundedPool({
      items: latestReviewFiles,
      bound: BOUND_OF_CONCURRENT_REVIEW_READS,
      map: (filePath) => getOneReviewContentTagged({ path: filePath }),
    })
  ).filter(isPresent);

  // check for approval in passage.jsonl
  const approvalReport = await getOnePassageReport({
    stone: input.stone.name,
    status: 'approved',
    route: input.route,
  });
  const approvalExists = approvalReport !== null;

  // combine into hash input
  const hashInput = [
    `reviewInputHash:${input.reviewInputHash}`,
    ...reviewContents,
    `approved:${approvalExists}`,
  ].join('\n');

  return crypto.createHash('sha256').update(hashInput).digest('hex');
};

/**
 * .what = one review file's content, tagged with its basename, as one hash input line —
 *         or null if the file vanished since enumeration
 * .why = names the per-file act, so the hash reads as a bounded pour of named reads; the read
 *        goes through the shared communicator, which owns the race-delete clamp
 *
 * .note = the basename, never the full path, keeps the hash deterministic: absolute paths
 *         vary by environment
 */
const getOneReviewContentTagged = async (input: {
  path: string;
}): Promise<string | null> => {
  const content = await getOneReviewArtifactContent({ path: input.path });
  if (content === null) return null;
  return `review:${path.basename(input.path)}:${content}`;
};
