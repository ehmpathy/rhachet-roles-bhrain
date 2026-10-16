import {
  asRunArtifactPath,
  NAME_OF_RUN_ARTIFACT,
  type RunArtifact,
} from '@src/domain.operations/review/asRunArtifactPath';
import { getOneFileText } from '@src/domain.operations/review/getOneFileText';
import { asRunArtifactParseFault } from '@src/domain.operations/review/meter/asRunArtifactParseFault';
import { ReviewRunArtifactError } from '@src/domain.operations/review/ReviewRunArtifactError';

/**
 * .what = reads one json artifact from a run's log dir, or answers null when it is absent
 * .why = absence is the signal the meter is built to read, so it must not throw; but a
 *        PRESENT-and-malformed file is a real defect and must fail loud
 *        (rule.forbid.failhide — a corrupt artifact must never read as an absent one).
 *        one home for the read, so every meter reader names a torn artifact the same way
 *
 * .note = a read fault (an EACCES on a file that exists) surfaces via `getOneFileText` as a
 *         `ReviewRunArtifactError` with its path; only a parse fault is a torn artifact, and
 *         any other throw (a RangeError) surfaces as itself
 * .note = every json artifact a run writes is a record, so a body that parses to aught
 *         else — `5`, `[]`, `"x"`, or a literal `null` — is torn too. it must not read as a
 *         record with no fields: that would meter a corrupt run as one that simply recorded
 *         no identity, the absence-as-a-fact inversion this reader exists to refuse
 * .note = the record's fields stay `unknown`: a file on disk is untrusted input, so each
 *         caller binds the field NAMES of its own declared (deep-partial) shape at its own
 *         call site, and its optional-chained reads gate each field
 */
export const getOneRunArtifactJson = async (input: {
  dir: string;
  artifact: RunArtifact;
}): Promise<Record<string, unknown> | null> => {
  // read the body; only an absence answers null
  const file = NAME_OF_RUN_ARTIFACT[input.artifact];
  const raw = await getOneFileText({
    at: asRunArtifactPath({ dir: input.dir, artifact: input.artifact }),
  });
  if (raw === null) return null;

  // parse it; a torn body names its file, never a bare SyntaxError
  const body = ((): unknown => {
    try {
      return JSON.parse(raw);
    } catch (error) {
      throw asRunArtifactParseFault({ error, dir: input.dir, file });
    }
  })();

  // a body that parsed but is no record is torn as well
  if (!isRunArtifactRecord(body))
    throw new ReviewRunArtifactError(
      `review log artifact is present but holds no record: ${file}`,
      { dir: input.dir, file, kind: body === null ? 'null' : typeof body },
    );
  return body;
};

/**
 * .what = whether a parsed artifact body is a record (a plain json object)
 * .why = the one type check the reader narrows through, in place of a cast
 */
const isRunArtifactRecord = (body: unknown): body is Record<string, unknown> =>
  typeof body === 'object' && body !== null && !Array.isArray(body);
