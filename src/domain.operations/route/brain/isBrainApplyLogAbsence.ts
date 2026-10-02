/**
 * .what = checks if an error is the ABSENCE-shaped class for the brain APPLY log — the codes
 *         that mean *"this diagnostic cannot exist on this host, and that is benign"*
 *
 * .why = the three apply-log operations catch only this EXPECTED class and let every other
 *        fault travel (`rule.forbid.failhide`); the peer of `isEEXIST`
 *
 * .the allowlist, and why each code is on it:
 *   - `ENOENT`  — a path component is gone. the log has no home, and no fault caused it
 *   - `ENOTDIR` — a path component is a file. same shape, different cause
 *   - `EACCES` / `EPERM` — the checkout is not ours to write. a sandbox, a CI runner, a
 *                          read-only mount by permission rather than by filesystem
 *   - `EROFS`   — the filesystem itself is read-only. the same benign absence, one layer down
 *   - `EBADF`   — a descriptor already closed. the idempotency arm of
 *                 `delBrainApplyLogHandoff`, where a second close is the CONVERGENT outcome
 *                 rather than a fault (`rule.require.idempotent-operations`)
 *
 * 🔴 .note = DELIBERATELY absent: `ENOSPC`, `EMFILE` / `ENFILE`, `EIO` — machine faults an
 *           operator can act on, which the apply log exists to make visible
 * .note = it reads `code`, as `isEEXIST` does: node has no constructor per code
 */
const CODES_ABSENCE = [
  'ENOENT',
  'ENOTDIR',
  'EACCES',
  'EPERM',
  'EROFS',
  'EBADF',
] as const;

export const isBrainApplyLogAbsence = (error: unknown): boolean => {
  if (error && typeof error === 'object' && 'code' in error) {
    return (CODES_ABSENCE as readonly string[]).includes(
      (error as { code: string }).code,
    );
  }
  return false;
};
