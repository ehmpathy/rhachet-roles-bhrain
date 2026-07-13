import { asHashShake256 } from 'hash-fns';
import * as path from 'path';

import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { getAllStoneArtifacts } from '@src/domain.operations/route/stones/getAllStoneArtifacts';

import { getGitBlobHashes } from '../artifact/getGitBlobHashes';

/**
 * .what = format files and blob hashes as sorted hash entries
 * .why = produces deterministic string format for content hash computation
 */
const asSortedHashEntries = (input: {
  files: string[];
  blobHashes: Record<string, string>;
  cwd: string;
}): string[] => {
  const sortedFiles = [...input.files].sort();

  return sortedFiles.map((filePath) => {
    const relPath = path.relative(input.cwd, filePath);
    const blobHash = input.blobHashes[filePath] ?? 'deleted';
    return `${relPath}:${blobHash}`;
  });
};

/**
 * .what = computes hash of review inputs (artifacts)
 * .why = reviews hash on their inputs for cache lookup
 *
 * reviews evaluate artifacts, so their input hash is the artifact content hash.
 * same artifact content = same review result (deterministic).
 *
 * uses git blob hashes instead of file reads to avoid OOM on 700+ files.
 * git already computed the content hashes — we reuse them.
 */
export const computeStoneReviewInputHash = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<string> => {
  // get all artifact files via the reusable operation
  const allFiles = await getAllStoneArtifacts(input);

  // get git blob hashes without file reads
  const cwd = process.cwd();
  const blobHashes = getGitBlobHashes({ files: allFiles, cwd });

  // format as sorted hash entries
  const hashEntries = asSortedHashEntries({ files: allFiles, blobHashes, cwd });

  // compute combined hash via shake256 (variable-length cryptographic hash)
  // .note = 9 bytes = 18 hex chars = 72 bits of entropy, collision probability negligible
  const concatenated = hashEntries.join('\n');
  return asHashShake256(concatenated, { bytes: 9 });
};
