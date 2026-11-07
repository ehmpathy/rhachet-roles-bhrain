/**
 * .what = the pointer content that names a branch bound to more than one route
 * .why = the bash reader cannot detect a multi-bind; the writer can, so it marks the pointer
 *        and the reader prints the fault line (fulcrum F10)
 *
 * .note = the reader holds a twin of this literal (`route.status.line.sh`); the reader suite's
 *         multi-bind case holds the two together
 */
export const MARK_OF_MULTI_BIND = '@multi-bind';
