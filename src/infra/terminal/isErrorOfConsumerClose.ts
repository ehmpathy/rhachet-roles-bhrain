import { getFsErrorCode } from '@src/utils/fs/getFsErrorCode';

/**
 * .what = the codes an output stream raises when its reader closed early
 * .why = `| head` or a `q` in `less` closes the pipe; the next write fails with one of these.
 *        named by code, so every other write fault stays loud (rule.forbid.failhide)
 */
const CODES_OF_CONSUMER_CLOSE: readonly string[] = [
  'EPIPE',
  'ERR_STREAM_DESTROYED',
];

/**
 * .what = whether a stream error means the reader left, never that the write broke
 * .why = an early close is a normal end of the reader; an `EACCES` or an `ENOSPC` is a real
 *        fault. only the first may end output in silence
 *
 * .note = reads the code off the SHAPE via `getFsErrorCode`, as `isErrorOfAbsence` does, so
 *         a stream error that crossed a vm realm still reads by its code
 */
export const isErrorOfConsumerClose = (input: { error: unknown }): boolean => {
  const code = getFsErrorCode(input.error);
  if (code === null) return false;
  return CODES_OF_CONSUMER_CLOSE.includes(code);
};
