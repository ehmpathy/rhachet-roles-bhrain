/**
 * .what = the whole set a run's split came from, and how that set is re-declared — the
 *         caller's own `--partition` flags, else the route's set and its command
 * .why = a coverage refusal proposes the set repaired, and must propose it in the form the
 *        driver declares it: a route set as one `route.guard.partition` command, a caller's
 *        set as corrected `--partition` flags. the precedence mirrors
 *        `getAllPartitionsDeclaredForRun`, so the set repaired is the set that was split
 *
 * .note = the route set is passed whole, never narrowed to the lane: a declaration replaces
 *         its scope whole (seed S46), so the repair must hold every partition, not this lane's
 * .note = null where neither declares a set — there is no split, so no repair
 */
export const asReviewPartitionRepairVia = (input: {
  /** the `--partition` values the caller passed */
  partitions: string[];
  /** the route's set for this reviewer, and its command; null for none */
  partitionsOfRoute: {
    partition: string[];
    command: { head: string; tail: string } | null;
  } | null;
}): {
  partition: string[];
  command: { head: string; tail: string } | null;
} | null => {
  // a caller's own declaration — repaired as corrected flags
  if (input.partitions.length > 0)
    return { partition: input.partitions, command: null };

  // the route's set — repaired as the command that re-declares it
  if (input.partitionsOfRoute && input.partitionsOfRoute.partition.length > 0)
    return input.partitionsOfRoute;

  // no set, no repair
  return null;
};
