import * as fs from 'fs/promises';

import { isErrorOfArtifactReadFault } from '@src/domain.operations/review/isErrorOfArtifactReadFault';
import { ReviewRunArtifactError } from '@src/domain.operations/review/ReviewRunArtifactError';
import { isErrorOfAbsence } from '@src/utils/fs/isErrorOfAbsence';

/**
 * .what = tells whether one run's artifact is there — and names a fault of the
 *         artifact read as an ARTIFACT defect
 * .why = the meter isolates one run's fault to one `unknown` row, and it recognizes
 *        exactly one class as that fault: `ReviewRunArtifactError`. a transient EACCES
 *        or EMFILE on one run's prompt must take that class, or it fails the whole
 *        corpus scan. `getOneFileText` answers the read question this way; this is its
 *        presence peer.
 *
 * .note = only a fault of the read itself takes the wrap (`isErrorOfArtifactReadFault`).
 *         every other throw surfaces as itself, since a caller defect dressed as an
 *         artifact fault would hide as one quiet row (rule.forbid.failhide).
 *
 * .note = it probes with `fs.access` rather than through `isPathPresent`: that shared
 *         reader wraps every non-absence into one class with the errno folded into a
 *         string, so the allowlist above could no longer read the code off the shape.
 */
export const isRunArtifactPresent = async (input: {
  at: string;
}): Promise<boolean> => {
  try {
    await fs.access(input.at);
    return true;
  } catch (error) {
    // an absent artifact is a fact, never a fault
    if (isErrorOfAbsence({ error })) return false;

    // only a fault of the read itself is an artifact fault
    if (!isErrorOfArtifactReadFault({ error })) throw error;
    throw new ReviewRunArtifactError(
      'could not tell whether a run artifact is there',
      {
        at: input.at,
        error: String(error),
      },
    );
  }
};
