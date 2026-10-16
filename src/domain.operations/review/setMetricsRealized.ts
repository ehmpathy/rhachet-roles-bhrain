import * as fs from 'fs/promises';

import type { ReviewRunMetricsRealized } from '@src/domain.objects/Reviewer/ReviewRunMetricsRealized';
import { asRunArtifactPath } from '@src/domain.operations/review/asRunArtifactPath';

/**
 * .what = writes the MEASURED tokens, spend, and wall time, after the brain answered
 * .why = 🔴 this is the one artifact the cost meter reads, at every breadth. it is
 *        the ground under wish bar 4 — *a run's cost is measured, refused, or
 *        unknown, never guessed* — so its absence is what earns a run the
 *        `unknown` grade rather than a `$0.00` anyone could mistake for a fact.
 *
 * .note = the payload is BOUND to `ReviewRunMetricsRealized`, and that bind is
 *         proven red: a rename of one token field took seven type errors across
 *         both sides at once. see that type's header.
 */
export const setMetricsRealized = async (input: {
  logDir: string;
  metrics: ReviewRunMetricsRealized;
}): Promise<{ path: string }> => {
  const at = asRunArtifactPath({ dir: input.logDir, artifact: 'realized' });
  await fs.writeFile(at, JSON.stringify(input.metrics, null, 2), 'utf-8');
  return { path: at };
};
