import { getFsErrorCode } from '@src/utils/fs/getFsErrorCode';

/**
 * .what = the errno codes a filesystem answers when it refuses a write
 * .why = a full disk, a quota, a read-only or permission-locked mount, an IO fault, a
 *        dir that vanished, a path held by a directory where a file must land (the
 *        rename codes), a descriptor table at its limit. each is the ENVIRONMENT that
 *        refused the write, never a defect in the code that asked
 */
const CODES_OF_WRITE_REFUSAL = [
  'ENOSPC',
  'EDQUOT',
  'EROFS',
  'EACCES',
  'EPERM',
  'EIO',
  'EBUSY',
  'ENOENT',
  'ENOTDIR',
  'EISDIR',
  'EEXIST',
  'ENOTEMPTY',
  'EMFILE',
  'ENFILE',
] as const;

/**
 * .what = tells whether a caught error is the filesystem's refusal of a write
 * .why = 🔴 a catch that tolerates a failed write must name what it tolerates. an
 *        allowlist by KIND — "it has a `code`" — admits every errno there is; an
 *        allowlist by NAME admits only the refusals a write can meet, and every other
 *        throw, a code-less programmer error among them, surfaces as itself
 *        (rule.forbid.failhide)
 *
 * .note = reads the code off the SHAPE via `getFsErrorCode`, never `instanceof Error`,
 *         for the jest-realm reason `isErrorOfAbsence` states
 */
export const isErrorOfWriteRefusal = (input: { error: unknown }): boolean => {
  const code = getFsErrorCode(input.error);
  if (code === null) return false;
  // .note = the `as` widens the `as const` tuple to `readonly string[]` so `.includes`
  //         accepts any string; a widen, never a narrow, so it asserts naught
  return (CODES_OF_WRITE_REFUSAL as readonly string[]).includes(code);
};
