import * as fs from 'fs/promises';

import type { ReviewRunMetricsExpected } from '@src/domain.objects/Reviewer/ReviewRunMetricsExpected';
import { asRunArtifactPath } from '@src/domain.operations/review/asRunArtifactPath';

/**
 * .what = writes the PROJECTION — a token estimate and a cost guess, before the call
 * .why = 🔴 the payload is BOUND to `ReviewRunMetricsExpected` rather than handed to
 *        `JSON.stringify` as an inferred literal. an untyped write side is what let
 *        the peer artifact's rename read as a silent `0` — see that type's header,
 *        and `ReviewRunMetricsRealized`'s dated proof
 *
 * .note = 🔴 the meter NEVER reads this file, at any breadth. it is an estimate, and
 *         `getOneReviewRunMeter` promises no estimate can enter a reported figure.
 *         its audience is a human, under a `🔭 projection` header.
 */
export const setMetricsExpected = async (input: {
  logDir: string;
  metrics: ReviewRunMetricsExpected;
}): Promise<{ path: string }> => {
  const at = asRunArtifactPath({ dir: input.logDir, artifact: 'expected' });
  await fs.writeFile(at, JSON.stringify(input.metrics, null, 2), 'utf-8');
  return { path: at };
};
