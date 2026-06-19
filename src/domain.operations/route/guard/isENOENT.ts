/**
 * .what = checks if an error is ENOENT (file/directory not found)
 * .why = enables failfast pattern: catch only expected errors, rethrow others
 */
export const isENOENT = (error: unknown): boolean => {
  if (error && typeof error === 'object' && 'code' in error) {
    return (error as { code: string }).code === 'ENOENT';
  }
  return false;
};
