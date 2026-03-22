import * as fs from 'fs';
import * as path from 'path';

import type { ReflectScope } from '../scope/getReflectScope';
import { getOneSavepoint } from './getOneSavepoint';
import type { Savepoint } from './setSavepoint';

/**
 * .what = summary of all savepoints for a scope
 * .why = enables overview of captured code states
 */
export interface SavepointSummary {
  /**
   * total number of savepoints
   */
  count: number;

  /**
   * total bytes across all savepoints
   */
  totalBytes: number;

  /**
   * list of savepoints sorted by timestamp (oldest first)
   */
  savepoints: Savepoint[];
}

/**
 * .what = retrieves all savepoints for a scope
 * .why = enables browsable list of captured code states
 */
export const getAllSavepoints = (input: {
  scope: ReflectScope;
}): SavepointSummary => {
  const savepointsDir = path.join(input.scope.storagePath, 'savepoints');

  // return empty if no savepoints directory
  if (!fs.existsSync(savepointsDir)) {
    return {
      count: 0,
      totalBytes: 0,
      savepoints: [],
    };
  }

  // find all staged.patch files and extract timestamps
  const files = fs.readdirSync(savepointsDir);
  const timestamps = files
    .filter((f) => f.endsWith('.staged.patch'))
    .map((f) => f.replace('.staged.patch', ''))
    .sort();

  // load each savepoint
  const savepoints: Savepoint[] = [];
  let totalBytes = 0;

  for (const timestamp of timestamps) {
    const savepoint = getOneSavepoint({ scope: input.scope, at: timestamp });
    if (savepoint) {
      savepoints.push(savepoint);
      totalBytes +=
        savepoint.patches.stagedBytes + savepoint.patches.unstagedBytes;
    }
  }

  return {
    count: savepoints.length,
    totalBytes,
    savepoints,
  };
};
