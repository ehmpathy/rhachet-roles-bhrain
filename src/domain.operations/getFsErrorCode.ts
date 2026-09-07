/**
 * .what = read the `code` field off a node fs rejection (e.g. 'ENOENT', 'EEXIST'), or null
 * .why = one shape-based reader for fs error codes, reused by every findsert/stat guard in
 *        this folder. it matches on the code SHAPE, not `instanceof Error` — a native fs
 *        rejection can cross the test vm realm where instanceof breaks, but the code field
 *        holds. one primitive removes the copy-pasted guard and the `as ErrnoException`
 *        casts the review flagged as inconsistent (rule.forbid.as-cast)
 */
export const getFsErrorCode = (error: unknown): string | null => {
  if (typeof error !== 'object' || error === null || !('code' in error))
    return null;
  // `'code' in error` narrows error to hold a `code` key — no as-cast needed
  const { code } = error;
  return typeof code === 'string' ? code : null;
};
