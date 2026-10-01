/**
 * .what = checks if an error is EEXIST (the path already exists)
 * .why = enables failfast pattern: catch only expected errors, rethrow others
 *
 * .note = the one caller is the `wx` open in `withDriveStateLock`, where EEXIST is the
 *         NORMAL outcome of a contended acquire (another writer holds the lock) and every
 *         other code — EACCES, EROFS, ENOSPC — is a real fault that must surface
 */
export const isEEXIST = (error: unknown): boolean => {
  if (error && typeof error === 'object' && 'code' in error) {
    return (error as { code: string }).code === 'EEXIST';
  }
  return false;
};
