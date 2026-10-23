/**
 * .what = the `--claim` / `--into` flags paired into claims, or the fault that keeps them apart
 * .why = one `--into` serves every `--claim` (the common case: claim a few globs into one
 *        partition); else each `--claim` pairs with the `--into` at its position, so a count
 *        mismatch is ambiguous and refuses rather than guess a home
 */
export const asRouteGuardPartitionClaimsOfFlags = (input: {
  claim: string[];
  into: string[];
}): {
  claims: Array<{ glob: string; into: string }>;
  fault: string | null;
} => {
  // a claim names its home
  if (input.into.length === 0)
    return {
      claims: [],
      fault: '--claim needs --into <slug>, the held partition it joins',
    };

  // one home serves every claim
  if (input.into.length === 1)
    return {
      claims: input.claim.map((glob) => ({ glob, into: input.into[0]! })),
      fault: null,
    };

  // else one home per claim, by position
  if (input.into.length !== input.claim.length)
    return {
      claims: [],
      fault: `${input.claim.length} --claim beside ${input.into.length} --into — give one --into for all, or one per --claim`,
    };
  return {
    claims: input.claim.map((glob, index) => ({
      glob,
      into: input.into[index]!,
    })),
    fault: null,
  };
};
