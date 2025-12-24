import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * .what = writes output artifacts to log directory for auditability
 * .why = enables debugging, replay, and audit of review results
 */
export const writeOutputArtifacts = async (input: {
  logDir: string;
  response: object;
  review: string;
}): Promise<{ responsePath: string; reviewPath: string }> => {
  // ensure log directory exists (should already exist from writeInputArtifacts)
  await fs.mkdir(input.logDir, { recursive: true });

  // write output.response.json
  const responsePath = path.join(input.logDir, 'output.response.json');
  const responseContent = JSON.stringify(input.response, null, 2);
  await fs.writeFile(responsePath, responseContent, 'utf-8');

  // write output.review.md
  const reviewPath = path.join(input.logDir, 'output.review.md');
  await fs.writeFile(reviewPath, input.review, 'utf-8');

  return { responsePath, reviewPath };
};
