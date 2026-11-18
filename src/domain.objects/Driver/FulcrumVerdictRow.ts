/**
 * .what = one human verdict on one fulcrum, as the human-only lever recorded it
 * .why = verdict provenance: a `verdict` in a fulcrum's yaml is trusted only when the lever wrote
 *        a matched row in the route's ledger. a hand edit of the yaml has no row, so it cannot
 *        lift the gate
 * .note = a date, never a timestamp (`rule.forbid.timestamps-in-route-artifacts`)
 */
export interface FulcrumVerdictRow {
  case: string;
  ruled: 'upheld' | 'conceded';
  on: string;
  /**
   * the content hash of the entry the human read (`asFulcrumContentSeen`). a row proves its
   * verdict only while the entry still hashes to it, so an edit after the verdict re-opens it
   */
  seen: string;
}
