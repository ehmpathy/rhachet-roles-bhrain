/**
 * .what = the `--prune` / `--from` flags paired into prunes, or the fault that keeps them
 *         apart
 * .why = the mirror of `asRouteGuardPartitionClaimsOfFlags`, with one difference: a claim must
 *        name its home, a prune need not. a stale glob almost always sits in one partition,
 *        so no `--from` drops it wherever it sits; one `--from` serves every `--prune`; else
 *        each `--prune` pairs with the `--from` at its position, and a count mismatch refuses
 *        rather than guess
 */
export const asRouteGuardPartitionPrunesOfFlags = (input: {
  prune: string[];
  from: string[];
}): {
  prunes: Array<{ glob: string; from: string | null }>;
  fault: string | null;
} => {
  // no home named drops each glob wherever it sits
  if (input.from.length === 0)
    return {
      prunes: input.prune.map((glob) => ({ glob, from: null })),
      fault: null,
    };

  // one home serves every prune
  if (input.from.length === 1)
    return {
      prunes: input.prune.map((glob) => ({ glob, from: input.from[0]! })),
      fault: null,
    };

  // else one home per prune, by position
  if (input.from.length !== input.prune.length)
    return {
      prunes: [],
      fault: `${input.prune.length} --prune beside ${input.from.length} --from — give one --from for all, one per --prune, or none`,
    };
  return {
    prunes: input.prune.map((glob, index) => ({
      glob,
      from: input.from[index]!,
    })),
    fault: null,
  };
};
