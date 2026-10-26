/**
 * .what = the one stderr row the status line prints when its cache file cannot be read
 * .why = an unreadable cache is a miss, never a fault: the line renders afresh and the write
 *        that follows replaces the file. the row names the fault, the path, and the fix, so a
 *        cache that cannot heal (its dir unwritable too) is never silent
 *
 * .note = loaded lazily, only when a read faulted, so the hit path never pays for it
 * .note = no class header, as for the write fault row: no error is thrown, the line prints
 *         correct, and the exit is 0 (route fulcrum F9)
 */
export const asStatusLineCacheReadFaultRow = (input: {
  code: string;
  cachePath: string;
}): string =>
  `[route.status.line] fault: cache read failed (${input.code}) at ${input.cachePath}, the line renders afresh. fix: remove ${input.cachePath}, or repair its permissions`;
