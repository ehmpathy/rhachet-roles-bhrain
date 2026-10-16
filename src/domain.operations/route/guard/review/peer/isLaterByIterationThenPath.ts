import { compareStrings } from '@src/utils/compareStrings';

/**
 * .what = whether a candidate artifact is later than an incumbent, over the TOTAL order
 *         (iteration first, then path)
 * .why = every "latest by iteration" pick must be order-free. a max over iteration ALONE is a
 *        partial order: two artifacts tied on iteration leave a strict `>` with whichever
 *        arrived first, which is glob order, which differs per machine
 *        (rule.forbid.order-dependence). the path breaks every tie, since two files cannot
 *        share a path, so the pick is deterministic on any input order
 *
 * .note = an absent incumbent means the candidate is the first seen, so it is later by default
 */
export const isLaterByIterationThenPath = (input: {
  candidate: { iteration: number; path: string };
  incumbent: { iteration: number; path: string } | null;
}): boolean => {
  // the first candidate seen always wins
  if (input.incumbent === null) return true;

  // iteration carries the real recency
  if (input.candidate.iteration !== input.incumbent.iteration)
    return input.candidate.iteration > input.incumbent.iteration;

  // the path is the tie-break that makes the order total
  return compareStrings(input.candidate.path, input.incumbent.path) > 0;
};
