import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import type { ReflectScope } from '../scope/getReflectScope';

/**
 * .what = summary item for a single snapshot
 * .why = enables enumeration without full extraction
 */
export interface SnapshotSummaryItem {
  timestamp: string;
  path: string;
  sizeBytes: number;
  metadata: {
    transcript: {
      sessionCount: number;
    };
    savepoints: {
      count: number;
    };
    annotations: {
      count: number;
    };
  } | null;
}

/**
 * .what = summary of all snapshots for a scope
 * .why = enables enumeration and overview
 */
export interface SnapshotSummary {
  count: number;
  totalBytes: number;
  snapshots: SnapshotSummaryItem[];
}

/**
 * .what = reads metadata from a snapshot zip
 * .why = enables quick inspection without full extraction
 */
const readMetadataFromZip = (
  zipPath: string,
): SnapshotSummaryItem['metadata'] | null => {
  const tempDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'reflect-snapshot-read-'),
  );

  try {
    execSync(`unzip -q -o "${zipPath}" metadata.json -d "${tempDir}"`, {
      stdio: 'pipe',
    });

    const metadataPath = path.join(tempDir, 'metadata.json');
    if (!fs.existsSync(metadataPath)) {
      return null;
    }

    const content = fs.readFileSync(metadataPath, 'utf-8');
    const full = JSON.parse(content);

    return {
      transcript: {
        sessionCount:
          full.transcript?.sessionCount ?? full.transcript?.episodeCount ?? 0,
      },
      savepoints: { count: full.savepoints?.count ?? 0 },
      annotations: { count: full.annotations?.count ?? 0 },
    };
  } catch {
    return null;
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
};

/**
 * .what = enumerates all snapshots for a scope
 * .why = enables overview and selection
 */
export const getAllSnapshots = (input: {
  scope: ReflectScope;
}): SnapshotSummary => {
  // construct snapshots base directory
  const snapshotsBaseDir = path.join(input.scope.storagePath, 'snapshots');

  // return empty if directory absent
  if (!fs.existsSync(snapshotsBaseDir)) {
    return { count: 0, totalBytes: 0, snapshots: [] };
  }

  // enumerate date directories
  const dateDirs = fs.readdirSync(snapshotsBaseDir).filter((d) => {
    const fullPath = path.join(snapshotsBaseDir, d);
    return fs.statSync(fullPath).isDirectory() && d.startsWith('date=');
  });

  // collect all snapshots
  const snapshots: SnapshotSummaryItem[] = [];

  for (const dateDir of dateDirs) {
    const datePath = path.join(snapshotsBaseDir, dateDir);
    const files = fs.readdirSync(datePath);
    const zipFiles = files.filter((f) => f.endsWith('.snap.zip'));

    for (const zipFile of zipFiles) {
      const zipPath = path.join(datePath, zipFile);
      const stats = fs.statSync(zipPath);

      // extract timestamp from filename (YYYY-MM-DD.HHMMSS.snap.zip)
      const timestamp = zipFile.replace('.snap.zip', '');

      // read metadata
      const metadata = readMetadataFromZip(zipPath);

      snapshots.push({
        timestamp,
        path: zipPath,
        sizeBytes: stats.size,
        metadata,
      });
    }
  }

  // sort by timestamp (oldest first)
  snapshots.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  // compute totals
  const totalBytes = snapshots.reduce((sum, s) => sum + s.sizeBytes, 0);

  return {
    count: snapshots.length,
    totalBytes,
    snapshots,
  };
};
