/**
 * .what = the ledgers the status line render reads from the route's state dir
 * .why = one home for the names: the fingerprint allowlists them, and the bash reader's stale
 *        test (`route.status.line.sh`) types each one, held to this list by a parity test
 */
export const NAMES_OF_RENDER_LEDGERS: readonly string[] = [
  'passage.jsonl',
  'reviewPeerMeters.jsonl',
];
