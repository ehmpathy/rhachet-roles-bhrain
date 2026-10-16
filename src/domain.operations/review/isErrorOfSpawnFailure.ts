import { getFsErrorCode } from '@src/utils/fs/getFsErrorCode';

/**
 * .what = the errno codes that mean "the command could not be launched at all"
 * .why = an `--open` opener a driver named is an ARBITRARY string. every one of these
 *        codes says the same benign fact — the program they named is not on this box,
 *        or is not launchable — which is a fact about their input rather than a defect
 *        in this code.
 *
 * .note = EACCES rides here because a named file that exists and is not executable
 *         fails for the identical reason ENOENT does: no child process ever started.
 */
const CODES_OF_LAUNCH_FAILURE = [
  'ENOENT',
  'EACCES',
  'EPERM',
  'ENOTDIR',
  'E2BIG',
  'ENOEXEC',
] as const;

/**
 * .what = tells whether a caught `execSync` error means the child failed rather than
 *         this code did
 *
 * .why = it lets the `--open` catch allowlist. before it, the catch read
 *        `if (error instanceof Error)` — logs and drops the entire `Error`
 *        class, and silently swallows every non-`Error` throw with no
 *        rethrow, `rule.forbid.failhide`'s named mega-blocker shape exactly.
 *        the harm is concrete: the block runs after a review has fully
 *        succeeded, so a genuine malfunction inside it (a `TypeError`, an OOM,
 *        a later defect) reported as "opener unavailable" and the run still
 *        exited 0 — a driver read a clean review over a real fault
 *
 * .note = three shapes mean "the child failed", read as a union since
 *         `execSync` surfaces them differently: a `code` in the launch set
 *         (never started), a numeric `status` (exited non-zero), a `signal`
 *         (killed). an error with none of the three did not come from the
 *         child, so it is this code's own defect and must surface
 *
 * .note = `status` is read as a number, deliberately — `execSync` sets
 *         `status: 0` on success and never throws there, so any numeric
 *         status on a thrown error is a real child exit; a truthiness check
 *         would miss a `0`
 *
 * .note = reads every field off the shape, never off `instanceof Error`, for
 *         the same reason `isErrorOfAbsence` does: a native rejection can
 *         cross a test vm boundary where `instanceof` answers false against
 *         the sandboxed `Error`, and the fields survive that hop
 */
export const isErrorOfSpawnFailure = (input: { error: unknown }): boolean => {
  const code = getFsErrorCode(input.error);
  // .note = the `as` widens the `as const` tuple to `readonly string[]` so `.includes`
  //         accepts any string; a widen, never a narrow, so it asserts naught
  if (
    code !== null &&
    (CODES_OF_LAUNCH_FAILURE as readonly string[]).includes(code)
  )
    return true;

  if (typeof input.error !== 'object' || input.error === null) return false;

  // a child that started and exited non-zero carries a numeric `status`
  if ('status' in input.error && typeof input.error.status === 'number')
    return true;

  // a child that started and was killed carries a `signal`
  if ('signal' in input.error && typeof input.error.signal === 'string')
    return true;

  return false;
};
