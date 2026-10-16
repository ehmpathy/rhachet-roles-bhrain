import { getFsErrorCode } from '@src/utils/fs/getFsErrorCode';
import { isErrorOfDenial } from '@src/utils/fs/isErrorOfDenial';

/**
 * .what = the fs codes a read of one run artifact may hit, beyond absence and denial
 * .why = a path of the wrong kind (a dir where a file was), an io fault, a symlink loop,
 *        or a descriptor quota hit on one run's file. each is a fault of THAT artifact,
 *        so the meter may isolate it to one `unknown` row. absence and denial own their
 *        codes in the shared allowlists, so no second copy of them lives here
 */
const CODES_OF_ARTIFACT_READ_FAULT = [
  'EISDIR',
  'EIO',
  'ELOOP',
  'ENAMETOOLONG',
  'EMFILE',
  'ENFILE',
  'EBUSY',
  'ESTALE',
] as const;

/**
 * .what = tells whether a caught error is a fault of the artifact read itself
 * .why = the meter isolates a `ReviewRunArtifactError` to one row, so only a fault
 *        that truly belongs to one artifact may take that wrap. a wrap of every throw
 *        dressed a defect in the meter's own code (a bad argument, a logic bug) as an
 *        artifact fault, and the scan reported one `unknown` row where it should have
 *        failed loud (rule.forbid.failhide)
 *
 * .note = absence never reaches here: the readers answer it with their own sentinel
 *         before they ask this question
 *
 * .note = read off the errno SHAPE via `getFsErrorCode`, never `instanceof Error`, for
 *         the realm reason `isErrorOfAbsence` states
 */
export const isErrorOfArtifactReadFault = (input: {
  error: unknown;
}): boolean => {
  if (isErrorOfDenial({ error: input.error })) return true;
  const code = getFsErrorCode(input.error);
  if (code === null) return false;
  // .note = the `as` widens the `as const` tuple to `readonly string[]` so `.includes`
  //         accepts any string; a widen, never a narrow, so it asserts naught
  return (CODES_OF_ARTIFACT_READ_FAULT as readonly string[]).includes(code);
};
