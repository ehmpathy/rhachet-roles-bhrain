/**
 * .what = the specific filesystem error codes that count as a benign file-read fault
 * .why = the allowlist must be EXACT — any error that merely holds a string `code` (a custom
 *        domain error with `code: 'BAD_STATE'`, a library error) must NOT pass, or a real
 *        defect would masquerade as a benign fault and be swallowed (rule.forbid.failhide)
 */
const FS_READ_FAULT_CODES: ReadonlySet<string> = new Set([
  'ENOENT', // no such file or directory
  'EACCES', // permission denied
  'EISDIR', // a directory where a file was expected
  'ENOTDIR', // a file where a directory was expected
  'ELOOP', // too many symlink hops
  'ENAMETOOLONG', // the path is too long
]);

/**
 * .what = whether an error is a benign filesystem read fault (an unreadable or absent file)
 * .why = a display fallback covers ONLY an unreadable file; a genuine bug must rethrow so it
 *        surfaces loud. a match on `error.code` (not `error.message.includes(...)`) is what makes
 *        the allowlist exact — a real error whose message merely quotes a path that holds the
 *        text 'ENOENT' can no longer masquerade as a benign fault (rule.forbid.failhide).
 * .note = `'code' in error` narrows error to hold a `code` key, so `.code` reads with no cast;
 *         its value is still `unknown`, guarded by the typeof + allowlist below.
 */
export const isExpectedFsReadFault = (error: unknown): boolean => {
  if (error instanceof Error && 'code' in error) {
    const code: unknown = error.code;
    if (typeof code === 'string' && FS_READ_FAULT_CODES.has(code)) return true;
  }
  return false;
};
