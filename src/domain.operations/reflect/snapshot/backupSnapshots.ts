import { execSync } from 'child_process';
import * as fs from 'fs';
import { BadRequestError } from 'helpful-errors';
import * as path from 'path';

/**
 * .what = result of a backup operation
 * .why = enables verification of backup success
 */
export interface BackupResult {
  /**
   * source directory that was backed up
   */
  sourceDir: string;

  /**
   * s3 target uri
   */
  targetUri: string;

  /**
   * number of files synced
   */
  fileCount: number;

  /**
   * total size in bytes
   */
  totalBytes: number;
}

/**
 * .what = validates s3 uri format
 * .why = fail fast on invalid input
 */
const validateS3Uri = (uri: string): void => {
  if (!uri.startsWith('s3://')) {
    throw new BadRequestError('s3 uri must start with s3://', { uri });
  }
};

/**
 * .what = validates aws credentials are available
 * .why = fail fast before upload attempt
 */
const validateAwsCredentials = (): void => {
  try {
    execSync('aws sts get-caller-identity', { stdio: 'pipe' });
  } catch {
    throw new BadRequestError(
      'aws credentials not found. run `aws configure` or set AWS_PROFILE',
      {},
    );
  }
};

/**
 * .what = computes directory size and file count
 * .why = provides backup statistics
 */
const getDirectoryStats = (
  dir: string,
): { fileCount: number; totalBytes: number } => {
  if (!fs.existsSync(dir)) {
    return { fileCount: 0, totalBytes: 0 };
  }

  let fileCount = 0;
  let totalBytes = 0;

  const processDir = (currentDir: string): void => {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        processDir(fullPath);
      } else {
        fileCount++;
        totalBytes += fs.statSync(fullPath).size;
      }
    }
  };

  processDir(dir);
  return { fileCount, totalBytes };
};

/**
 * .what = backs up snapshots to s3
 * .why = enables durability and cross-machine access
 */
export const backupSnapshots = (input: {
  sourceDir: string;
  into: string;
}): BackupResult => {
  // validate inputs
  validateS3Uri(input.into);
  validateAwsCredentials();

  // verify source exists
  if (!fs.existsSync(input.sourceDir)) {
    throw new BadRequestError('source directory does not exist', {
      sourceDir: input.sourceDir,
    });
  }

  // compute target path
  // ~/.rhachet/storage/... -> rhachet/storage/...
  const homeDir = process.env.HOME ?? '';
  const relativePath = input.sourceDir.replace(
    path.join(homeDir, '.rhachet'),
    'rhachet',
  );
  const targetUri = `${input.into.replace(/\/$/, '')}/${relativePath}`;

  // get stats before sync
  const { fileCount, totalBytes } = getDirectoryStats(input.sourceDir);

  // run aws s3 sync
  execSync(`aws s3 sync "${input.sourceDir}" "${targetUri}"`, {
    stdio: 'pipe',
  });

  return {
    sourceDir: input.sourceDir,
    targetUri,
    fileCount,
    totalBytes,
  };
};
