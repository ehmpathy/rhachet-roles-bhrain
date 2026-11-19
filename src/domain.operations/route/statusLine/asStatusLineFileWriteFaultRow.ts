/**
 * .what = the one stderr row a writer prints when the route's status file cannot be written
 * .why = the move the writer follows already landed; the status file is a display cache, so
 *        its fault never refuses the move. the line reads stale, or unknown if never written, until the next write, and the
 *        row names the cause, the route, and the fix
 *
 * .note = no `ConstraintError:` / `MalfunctionError:` header, by design: the move succeeded
 *         and the exit is unchanged. it keeps the status line's extant fault prefix
 */
export const asStatusLineFileWriteFaultRow = (input: {
  cause: string;
  route: string;
}): string =>
  `[route.status.line] fault: status file write failed (${input.cause}) for ${input.route}, the line reads stale, or unknown if never written, until the next write. fix: repair the cause, then rhx route.drive`;
