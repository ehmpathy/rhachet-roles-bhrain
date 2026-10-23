import { getFsErrorCode } from '@src/utils/fs/getFsErrorCode';
import { isErrorOfAbsence } from '@src/utils/fs/isErrorOfAbsence';
import { isErrorOfDenial } from '@src/utils/fs/isErrorOfDenial';

/**
 * .what = the fs codes a READ may hit that neither absence nor denial covers
 * .why = a display fallback over one file must also cover a path of the wrong kind (a
 *        directory, a symlink loop, a path too long to open). absence and denial own their
 *        codes in the shared allowlists, so only these three extras live here — no second
 *        copy of ENOENT or EACCES that could drift from the shared lists
 */
const CODES_OF_UNREADABLE_PATH = ['EISDIR', 'ELOOP', 'ENAMETOOLONG'] as const;

/**
 * .what = whether an error is a benign filesystem read fault (an unreadable or absent file)
 * .why = a display fallback covers ONLY an unreadable file; a genuine bug must rethrow so it
 *        surfaces loud. the gate is the shared absence + denial allowlists plus the extras
 *        above, all keyed on `error.code` (never `error.message`), so a real defect whose
 *        message merely quotes 'ENOENT' cannot masquerade as benign (rule.forbid.failhide).
 * .note = read by SHAPE via `getFsErrorCode`, never `instanceof Error`: an fs error raised in
 *         another realm (a jest vm, a worker) is not an instance of this realm's `Error`.
 */
export const isExpectedFsReadFault = (input: { error: unknown }): boolean => {
  if (isErrorOfAbsence({ error: input.error })) return true;
  if (isErrorOfDenial({ error: input.error })) return true;
  const code = getFsErrorCode(input.error);
  if (code === null) return false;
  // .note = the `as` widens the `as const` tuple to `readonly string[]` so `.includes`
  //         accepts any string; a widen, never a narrow, so it asserts naught
  return (CODES_OF_UNREADABLE_PATH as readonly string[]).includes(code);
};
