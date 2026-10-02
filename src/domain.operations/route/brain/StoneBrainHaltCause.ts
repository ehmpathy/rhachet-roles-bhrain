/**
 * .what = the seven distinct reasons a prescribed brain was never dispatched
 * .why = each names a different fix, so no two may share a cause
 *
 * .note = the split follows `clone whoami`'s exit codes (`rule.require.exit-code-semantics`):
 *         exit 2 is a constraint (`unenrolled`, the common case); any other non-zero exit is a
 *         malfunction. a halt that offers `rhx enroll` for a malfunction sends a reader down a
 *         fake path
 *
 * .note = each cause below parts two reads that need opposite remedies — do not re-fuse them:
 *         - `unreadable-payload` (the probe emitted non-json) ≠ `unreadable-address` (valid json,
 *           no address): a broken instrument vs a moved shape
 *         - `timed-out` ≠ `unreadable-clone`: the `WHOAMI_TIMEOUT_MS` cap settles first, so a slow unenrolled
 *           probe would otherwise never reach its `code === 2` branch
 *         - `killed` (`code === null`, a signal) ≠ `timed-out`: `timed-out` claims a cap fired
 *         - `spawn-failed`: the `rhx` binary never launched; the one cause not about the probe
 *
 * .note = in its own file so that both `getCloneAddress` (produces it) and `setStoneBrain`
 *         (reports it) import it with no cycle
 */
export type StoneBrainHaltCause =
  | 'unenrolled'
  | 'unreadable-clone'
  | 'unreadable-payload'
  | 'unreadable-address'
  | 'timed-out'
  | 'spawn-failed'
  | 'killed';
