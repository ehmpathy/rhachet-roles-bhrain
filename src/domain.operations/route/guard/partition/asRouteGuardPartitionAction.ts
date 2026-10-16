/**
 * .what = the write a `route.guard.partition` invocation asks for — declare a whole set,
 *         claim globs into a held set, prune globs from it, or clear the scope — or null
 *         where it asks to show
 * .why = the `none` sentinel and the claim-vs-declare split are domain rules, so they are
 *        read here once rather than in the contract that parses the flags
 *
 * .note = `none` clears the scope (fulcrum F105). the flags beside it are carried as `others`,
 *         so the write can refuse a clear that also names a set — that is two asks at once
 * .note = a claim and a prune are never given together; the contract refuses that pair
 *         before it reaches here
 */
export type RouteGuardPartitionAction =
  | { kind: 'declare'; partition: string[] }
  | { kind: 'claim'; claims: Array<{ glob: string; into: string }> }
  | {
      kind: 'prune';
      prunes: Array<{ glob: string; from: string | null }>;
    }
  | { kind: 'clear'; others: string[] };

/** the `--partition` value that clears a scope */
const PARTITION_CLEAR = 'none';

export const asRouteGuardPartitionAction = (input: {
  partition: string[];
  claims: Array<{ glob: string; into: string }>;
  prunes: Array<{ glob: string; from: string | null }>;
}): RouteGuardPartitionAction | null => {
  // a claim grows the held set
  if (input.claims.length > 0) return { kind: 'claim', claims: input.claims };

  // a prune shrinks it
  if (input.prunes.length > 0) return { kind: 'prune', prunes: input.prunes };

  // no flag at all asks to show what the scope holds
  if (input.partition.length === 0) return null;

  // the sentinel clears the scope; any flag beside it is kept so the write can refuse it
  if (input.partition.includes(PARTITION_CLEAR))
    return {
      kind: 'clear',
      others: input.partition.filter((value) => value !== PARTITION_CLEAR),
    };

  // else the flags are the whole set
  return { kind: 'declare', partition: input.partition };
};
