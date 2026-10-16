import * as fs from 'fs/promises';

import { asRunArtifactPath } from '@src/domain.operations/review/asRunArtifactPath';

/**
 * .what = writes output artifacts to log directory for auditability
 * .why = enables debug, replay, and audit of review results
 *
 * .note = both paths come from `asRunArtifactPath`, never a local `path.join`
 *         over a literal, so the artifact-grammar census in
 *         `stepReview.casePolluters` can claim to hold every artifact a run writes
 */
export const setOutputArtifacts = async (input: {
  logDir: string;
  response: object;
  review: string;
}): Promise<{ responsePath: string; reviewPath: string }> => {
  // ensure log directory exists (should already exist from setInputArtifacts)
  await fs.mkdir(input.logDir, { recursive: true });

  // write output.response.json
  const responsePath = asRunArtifactPath({
    dir: input.logDir,
    artifact: 'response',
  });
  const responseContent = JSON.stringify(input.response, null, 2);
  await fs.writeFile(responsePath, responseContent, 'utf-8');

  // write output.review.md
  const reviewPath = asRunArtifactPath({
    dir: input.logDir,
    artifact: 'review',
  });
  await fs.writeFile(reviewPath, input.review, 'utf-8');

  return { responsePath, reviewPath };
};
