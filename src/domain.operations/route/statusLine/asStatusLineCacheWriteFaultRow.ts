import * as path from 'path';

/**
 * .what = the one stderr row the status line prints when its cache cannot be written
 * .why = an unwritable cache never blanks the line, yet it silently restores the full
 *        per-repaint cost; the row names the fault, the path, and the fix
 *
 * .note = loaded lazily, only when a write faulted, so the hit path never pays for it
 * .note = no `ConstraintError:` / `MalfunctionError:` header, by design: no error is thrown,
 *         the line prints correct, and the exit is 0. a class header would claim a failure
 *         that did not happen. it keeps the extant degrade prefix `[route.status.line] fault:`
 *         (route fulcrum F9)
 */
export const asStatusLineCacheWriteFaultRow = (input: {
  code: string;
  cachePath: string;
}): string =>
  `[route.status.line] fault: cache write failed (${input.code}) at ${input.cachePath}, the line renders uncached. fix: make ${path.dirname(input.cachePath)} a writable dir (remove a file in its place, or repair its permissions)`;
