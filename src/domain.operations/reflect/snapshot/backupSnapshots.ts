import { execSync } from 'child_process';
import * as fs from 'fs';
import { BadRequestError, ConstraintError } from 'helpful-errors';
import * as path from 'path';

import { asShellSingleQuoted } from '@src/utils/asShellSingleQuoted';
import { isErrorOfAbsence } from '@src/utils/fs/isErrorOfAbsence';

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
    // env named explicitly, so the check reads the caller's view of the env rather than
    // the host process's — identical in prod, and what lets a test scope "no credentials"
    execSync('aws sts get-caller-identity', {
      stdio: 'pipe',
      env: process.env,
    });
  } catch (error) {
    // only a child that exited is a probe verdict; aught else is a defect, so it rethrows
    if (!isErrorOfChildExit(error)) throw error;

    // status 127 = the shell found no `aws` binary, which is no credential fault
    if (error.status === 127)
      throw new ConstraintError(
        'aws cli not found. install it, then run `aws configure`',
        { stderr: String(error.stderr ?? '').trim() },
      );

    // any other exit is sts' refusal; its stderr rides along, so a network fault reads as one
    throw new ConstraintError(
      'aws credentials not found. run `aws configure` or set AWS_PROFILE',
      { stderr: String(error.stderr ?? '').trim() },
    );
  }
};

/**
 * .what = checks whether an error is a child process exit from execSync
 * .why = the credential probe allowlists a child exit and rethrows all else
 * .note = a shape check, never `instanceof Error`: a child_process error can be minted in
 *         another realm (jest's vm), where `instanceof` reads false on a genuine exit
 */
const isErrorOfChildExit = (
  error: unknown,
): error is { status: number | null; stderr?: Buffer | string } =>
  typeof error === 'object' &&
  error !== null &&
  'status' in error &&
  (typeof error.status === 'number' || error.status === null);

/**
 * .what = computes directory size and file count
 * .why = provides backup statistics
 */
const getDirectoryStats = (
  dir: string,
): { fileCount: number; totalBytes: number } => {
  // one read, its absence handled inside the call: a dir gone at read time yields the
  // same zero a dir gone at probe time would, never a bare ENOENT (i018 r010 nitpick.1)
  const entries = getAllEntriesOfDirOrNull({ dir });
  if (entries === null) return { fileCount: 0, totalBytes: 0 };

  // sum each entry's stats: a subdirectory recurses, a file counts once with its size
  // .note = an immutable fold, no accumulator
  return entries
    .map((entry) => getEntryStats({ dir, entry }))
    .reduce(
      (sum, stats) => ({
        fileCount: sum.fileCount + stats.fileCount,
        totalBytes: sum.totalBytes + stats.totalBytes,
      }),
      { fileCount: 0, totalBytes: 0 },
    );
};

/**
 * .what = the stats of one directory entry — a whole subtree for a directory, one file else
 * .why = keeps the fold in getDirectoryStats a plain sum, with no branch inside it
 */
const getEntryStats = (input: {
  dir: string;
  entry: fs.Dirent;
}): { fileCount: number; totalBytes: number } => {
  const fullPath = path.join(input.dir, input.entry.name);

  // a directory contributes its whole subtree
  if (input.entry.isDirectory()) return getDirectoryStats(fullPath);

  // a file contributes itself; one gone since the dir was listed contributes naught
  const size = getOneFileSizeOrNull({ path: fullPath });
  if (size === null) return { fileCount: 0, totalBytes: 0 };
  return { fileCount: 1, totalBytes: size };
};

/**
 * .what = the entries of a directory, or null where the directory is not there
 * .why = collapses the probe and the read into one call, so no window parts them
 * .note = only an absence is benign (isErrorOfAbsence); every other fs fault rethrows
 */
const getAllEntriesOfDirOrNull = (input: {
  dir: string;
}): fs.Dirent[] | null => {
  try {
    return fs.readdirSync(input.dir, { withFileTypes: true });
  } catch (error) {
    if (isErrorOfAbsence({ error })) return null;
    throw error;
  }
};

/**
 * .what = the byte size of one file, or null where the file is not there
 * .why = an entry listed then removed (or a link whose target is gone) is skipped, never
 *        an abort of the backup
 * .note = only an absence is benign (isErrorOfAbsence); every other fs fault rethrows
 */
const getOneFileSizeOrNull = (input: { path: string }): number | null => {
  try {
    return fs.statSync(input.path).size;
  } catch (error) {
    if (isErrorOfAbsence({ error })) return null;
    throw error;
  }
};

/**
 * .what = backs up snapshots to s3
 * .why = enables durability and cross-machine access
 */
export const backupSnapshots = (input: {
  sourceDir: string;
  into: string;
}): BackupResult => {
  // validate the caller's inputs — local and free, so they run before the network call
  validateS3Uri(input.into);
  if (!fs.existsSync(input.sourceDir)) {
    throw new BadRequestError('source directory does not exist', {
      sourceDir: input.sourceDir,
    });
  }

  // validate aws credentials — a network call, so it runs once the inputs hold
  validateAwsCredentials();

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

  // run aws s3 sync; each path is one single-quoted shell word, so a `$`, a backtick, or
  // a quote in it reaches aws literally rather than rewrite the command (i018 r010 nitpick.2)
  execSync(
    `aws s3 sync ${asShellSingleQuoted({ value: input.sourceDir })} ${asShellSingleQuoted({ value: targetUri })}`,
    // env named explicitly, as the credential probe does, so the sync reads the caller's view
    { stdio: 'pipe', env: process.env },
  );

  return {
    sourceDir: input.sourceDir,
    targetUri,
    fileCount,
    totalBytes,
  };
};
