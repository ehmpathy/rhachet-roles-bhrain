import { isErrorOfArtifactReadFault } from '@src/domain.operations/review/isErrorOfArtifactReadFault';
import { ReviewRunArtifactError } from '@src/domain.operations/review/ReviewRunArtifactError';
import { getOneFileTextOrNull } from '@src/utils/fs/getOneFileTextOrNull';

/**
 * .what = reads a file's utf-8 text, or null where the file is not there
 * .why = 🔴 the sharpest failhide on this branch lived here. a run artifact that is
 *        ABSENT means the run died before it wrote metrics — a fact, graded
 *        `refused`, which renders `$0` as a MEASURED nil. so a bare
 *        `.catch(() => null)` turns an EACCES on a file that plainly exists into a
 *        confident zero in a cost report: the exact silent corruption the meter was
 *        built to refuse (rule.forbid.failhide).
 *
 *        absence keeps its sentinel (via `getOneFileTextOrNull`); a fault of the read
 *        itself (`isErrorOfArtifactReadFault`) surfaces with its path, as a
 *        `ReviewRunArtifactError`; every other throw surfaces as itself, since the
 *        meter isolates the artifact class to one quiet row and a caller defect must
 *        never hide there.
 */
export const getOneFileText = async (input: {
  at: string;
}): Promise<string | null> => {
  try {
    return await getOneFileTextOrNull({ path: input.at });
  } catch (error) {
    // only a fault of the read itself is an artifact fault
    if (!isErrorOfArtifactReadFault({ error })) throw error;
    throw new ReviewRunArtifactError('could not read a file', {
      at: input.at,
      error: String(error),
    });
  }
};
