/**
 * .what = the stderr row for a status line pointer write that failed
 * .why = the move the writer follows already landed; the pointer is a display index, so its
 *        fault never refuses the move. the row names the code, the path, and the fix, beside
 *        its peer for the status file (`asStatusLineFileWriteFaultRow`)
 */
export const asStatusLinePointerWriteFaultRow = (input: {
  code: string;
  pointerPath: string;
}): string =>
  `[route.status.line] fault: pointer write failed (${input.code}) at ${input.pointerPath}. fix: repair the cause, then rhx route.drive`;
