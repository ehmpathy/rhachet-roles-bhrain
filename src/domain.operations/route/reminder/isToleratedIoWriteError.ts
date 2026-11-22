import { asNodeErrnoCode } from '../asNodeErrnoCode';
import { TOLERATED_IO_WRITE_ERRNOS } from './TOLERATED_IO_WRITE_ERRNOS';

/**
 * .what = whether a thrown value is an expected host io fault — an errno in TOLERATED_IO_WRITE_ERRNOS
 * .why = every reminder writer that tolerates an io fault asks the same question; one predicate keeps
 *        them in agreement. a non-errno throw (a TypeError from a bug) is never tolerated
 */
export const isToleratedIoWriteError = (input: { error: unknown }): boolean => {
  const errno = asNodeErrnoCode(input.error);
  return errno !== undefined && TOLERATED_IO_WRITE_ERRNOS.includes(errno);
};
