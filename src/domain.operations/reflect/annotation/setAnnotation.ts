import * as fs from 'fs';
import { BadRequestError } from 'helpful-errors';
import * as path from 'path';

import type { ReflectScope } from '../scope/getReflectScope';

/**
 * .what = an annotation labels a moment in the timeline for reflection
 * .why = enables humans to mark defects, lessons, or discoveries
 */
export interface Annotation {
  /**
   * iso timestamp when annotation was created
   */
  timestamp: string;

  /**
   * the annotation text
   */
  text: string;

  /**
   * path to annotation file
   */
  path: string;

  /**
   * metadata about the annotation
   */
  metadata: {
    cwd: string;
    branch: string;
    gitRepoName: string;
  };
}

/**
 * .what = generates ISO timestamp for annotation
 * .why = consistent timestamp format across all annotations
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
 * .what = creates an annotation in the timeline
 * .why = enables humans to label moments for later reflection
 */
export const setAnnotation = (input: {
  scope: ReflectScope;
  text: string;
}): Annotation => {
  // validate text is not empty
  if (!input.text || input.text.trim().length === 0) {
    throw new BadRequestError('annotation text cannot be empty', {
      text: input.text,
    });
  }

  // generate timestamp
  const timestamp = generateTimestamp();

  // construct path
  const annotationsDir = path.join(input.scope.storagePath, 'annotations');
  const annotationPath = path.join(
    annotationsDir,
    `${timestamp}.annotation.md`,
  );

  // build metadata
  const metadata = {
    cwd: input.scope.cwd,
    branch: input.scope.branch,
    gitRepoName: input.scope.gitRepoName,
  };

  // build annotation content
  const content = `---
timestamp: ${timestamp}
branch: ${input.scope.branch}
repo: ${input.scope.gitRepoName}
worktree: ${input.scope.worktreeName}
---

${input.text.trim()}
`;

  // write annotation
  fs.mkdirSync(annotationsDir, { recursive: true });
  fs.writeFileSync(annotationPath, content);

  return {
    timestamp,
    text: input.text.trim(),
    path: annotationPath,
    metadata,
  };
};
