import archiver from 'archiver';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { getAllAnnotations } from '../annotation/getAllAnnotations';
import { getAllSavepoints } from '../savepoint/getAllSavepoints';
import type { ReflectScope } from '../scope/getReflectScope';
import { getTranscriptSource } from '../transcript/getTranscriptSource';

/**
 * .what = a snapshot bundles transcript + savepoints + annotations
 * .why = enables experience preservation for later reflection
 */
export interface Snapshot {
  /**
   * ISO timestamp when snapshot was captured
   */
  timestamp: string;

  /**
   * path to the snapshot zip file
   */
  path: string;

  /**
   * metadata about the snapshot contents
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
 * .what = generates ISO timestamp for snapshot
 * .why = consistent timestamp format across all snapshots
 */
const generateTimestamp = (): string => {
  const now = new Date();
  const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const time = now
    .toISOString()
    .split('T')[1]
    ?.split('.')[0]
    ?.replace(/:/g, ''); // HHMMSS
  return `${date}.${time}`;
};

/**
 * .what = creates a snapshot archive
 * .why = bundles transcript + savepoints + annotations for preservation
 */
export const captureSnapshot = async (input: {
  scope: ReflectScope;
}): Promise<Snapshot> => {
  // get transcript source
  const transcriptSource = getTranscriptSource({ cwd: input.scope.cwd });
  if (!transcriptSource) {
    throw new Error(
      `no claude code project found for ${input.scope.cwd}. expected at ~/.claude/projects/`,
    );
  }

  // get savepoints and annotations
  const savepointsSummary = getAllSavepoints({ scope: input.scope });
  const annotationsSummary = getAllAnnotations({ scope: input.scope });

  // generate timestamp
  const timestamp = generateTimestamp();
  const dateOnly = timestamp.split('.')[0]; // YYYY-MM-DD

  // construct snapshot path
  const snapshotDir = path.join(
    input.scope.storagePath,
    'snapshots',
    `date=${dateOnly}`,
  );
  fs.mkdirSync(snapshotDir, { recursive: true });
  const snapshotPath = path.join(snapshotDir, `${timestamp}.snap.zip`);

  // create temp directory for assembly
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reflect-snapshot-'));

  try {
    // copy transcript files
    const transcriptDir = path.join(tempDir, 'transcript');
    fs.mkdirSync(transcriptDir, { recursive: true });

    // copy main transcript file
    const mainFileName = path.basename(transcriptSource.mainFile);
    fs.copyFileSync(
      transcriptSource.mainFile,
      path.join(transcriptDir, mainFileName),
    );

    // copy compaction files if present
    for (const compactionFile of transcriptSource.compactionFiles) {
      const compactionFileName = path.basename(compactionFile);
      fs.copyFileSync(
        compactionFile,
        path.join(transcriptDir, compactionFileName),
      );
    }

    // copy savepoint patches
    if (savepointsSummary.savepoints.length > 0) {
      const savepointsDir = path.join(tempDir, 'savepoints');
      fs.mkdirSync(savepointsDir, { recursive: true });

      for (const savepoint of savepointsSummary.savepoints) {
        // copy staged patch
        const stagedFileName = path.basename(savepoint.stagedPatchPath);
        if (fs.existsSync(savepoint.stagedPatchPath)) {
          fs.copyFileSync(
            savepoint.stagedPatchPath,
            path.join(savepointsDir, stagedFileName),
          );
        }

        // copy unstaged patch
        const unstagedFileName = path.basename(savepoint.unstagedPatchPath);
        if (fs.existsSync(savepoint.unstagedPatchPath)) {
          fs.copyFileSync(
            savepoint.unstagedPatchPath,
            path.join(savepointsDir, unstagedFileName),
          );
        }
      }
    }

    // copy annotation files
    if (annotationsSummary.annotations.length > 0) {
      const annotationsDir = path.join(tempDir, 'annotations');
      fs.mkdirSync(annotationsDir, { recursive: true });

      for (const annotation of annotationsSummary.annotations) {
        const annotationFileName = path.basename(annotation.path);
        if (fs.existsSync(annotation.path)) {
          fs.copyFileSync(
            annotation.path,
            path.join(annotationsDir, annotationFileName),
          );
        }
      }
    }

    // write metadata.json
    const metadata = {
      gitRepoName: input.scope.gitRepoName,
      worktreeName: input.scope.worktreeName,
      branch: input.scope.branch,
      timestamp,
      transcript: {
        episodeCount: transcriptSource.episodeCount,
        mainFile: mainFileName,
      },
      savepoints: {
        count: savepointsSummary.count,
        totalBytes: savepointsSummary.totalBytes,
      },
      annotations: {
        count: annotationsSummary.count,
      },
    };
    fs.writeFileSync(
      path.join(tempDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2),
    );

    // create zip archive
    await createZipArchive(tempDir, snapshotPath);

    return {
      timestamp,
      path: snapshotPath,
      metadata,
    };
  } finally {
    // cleanup temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
};

/**
 * .what = creates a zip archive from a directory
 * .why = bundles snapshot contents into a single file
 */
const createZipArchive = (
  sourceDir: string,
  outputPath: string,
): Promise<void> => {
  return new Promise((done, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => done());
    archive.on('error', (err) => reject(err));

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
};
