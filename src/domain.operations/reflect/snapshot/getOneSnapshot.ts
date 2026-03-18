import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import type { ReflectScope } from '../scope/getReflectScope';

/**
 * .what = details of a specific snapshot
 * .why = enables inspection of snapshot contents
 */
export interface SnapshotDetails {
  /**
   * ISO timestamp when snapshot was captured
   */
  timestamp: string;

  /**
   * path to the snapshot zip file
   */
  path: string;

  /**
   * size of the snapshot in bytes
   */
  sizeBytes: number;

  /**
   * metadata from the snapshot
   */
  metadata: {
    gitRepoName: string;
    worktreeName: string;
    branch: string;
    transcript: {
      episodeCount: number;
      mainFile: string;
    };
    savepoints: {
      count: number;
      totalBytes: number;
    };
    annotations: {
      count: number;
    };
  };
}

/**
 * .what = reads metadata from a snapshot zip
 * .why = enables inspection without full extraction
 */
const readMetadataFromZip = (
  zipPath: string,
): SnapshotDetails['metadata'] | null => {
  // create temp dir for extraction
  const tempDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'reflect-snapshot-read-'),
  );

  try {
    // extract only metadata.json
    execSync(`unzip -q -o "${zipPath}" metadata.json -d "${tempDir}"`, {
      stdio: 'pipe',
    });

    const metadataPath = path.join(tempDir, 'metadata.json');
    if (!fs.existsSync(metadataPath)) {
      return null;
    }

    const content = fs.readFileSync(metadataPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  } finally {
    // cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
};

/**
 * .what = retrieves details of a specific snapshot
 * .why = enables inspection of snapshot contents
 */
export const getOneSnapshot = (input: {
  scope: ReflectScope;
  at: string;
}): SnapshotDetails | null => {
  // extract date from timestamp (YYYY-MM-DD.HHMMSS -> YYYY-MM-DD)
  const dateOnly = input.at.split('.')[0];
  if (!dateOnly) return null;

  // construct expected path
  const snapshotDir = path.join(
    input.scope.storagePath,
    'snapshots',
    `date=${dateOnly}`,
  );

  const snapshotPath = path.join(snapshotDir, `${input.at}.snap.zip`);

  // return null if not found
  if (!fs.existsSync(snapshotPath)) {
    return null;
  }

  // get file size
  const stats = fs.statSync(snapshotPath);
  const sizeBytes = stats.size;

  // read metadata
  const metadata = readMetadataFromZip(snapshotPath);
  if (!metadata) {
    return null;
  }

  return {
    timestamp: input.at,
    path: snapshotPath,
    sizeBytes,
    metadata,
  };
};
