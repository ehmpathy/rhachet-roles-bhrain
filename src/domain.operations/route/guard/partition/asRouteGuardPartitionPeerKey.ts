/**
 * .what = the key a one-reviewer partition override is held under
 * .why = one shape for the key, so a write and every read of the `byPeer` map agree on it
 */
export const asRouteGuardPartitionPeerKey = (input: {
  stone: string;
  peer: string;
}): string => `${input.stone}/${input.peer}`;
