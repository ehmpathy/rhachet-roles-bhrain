import * as fs from 'fs/promises';

import type { ReviewRunArgsRecord } from '@src/domain.objects/Reviewer/ReviewRunArgsRecord';
import { asRunArtifactPath } from '@src/domain.operations/review/asRunArtifactPath';

/**
 * .what = writes a run's `input.args.json` — the invocation, the scope, the projection
 * .why = the meter reads a run's guard identity and brain off this record alone, so every
 *        run that spends — a review, a partition prime, a lane poke — writes one, through
 *        one writer, in one shape
 */
export const setReviewRunArgsArtifact = async (input: {
  logDir: string;
  record: ReviewRunArgsRecord;
}): Promise<{ argsPath: string }> => {
  const argsPath = asRunArtifactPath({ dir: input.logDir, artifact: 'args' });
  await fs.mkdir(input.logDir, { recursive: true });
  await fs.writeFile(argsPath, JSON.stringify(input.record, null, 2), 'utf-8');
  return { argsPath };
};
