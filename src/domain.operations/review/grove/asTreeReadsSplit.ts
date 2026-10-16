import type { ReviewRunMeter } from '@src/domain.objects/Reviewer/ReviewRunMeter';
import type { ReviewTree } from '@src/domain.operations/review/grove/getAllReviewTrees';

/**
 * .what = one tree's read of its run meters, or the fault that barred it
 * .why = the unit the grove's per-tree isolation yields; a fault and a denial are
 *        carried beside the runs so the split and the refusal each read one shape
 */
export interface ReviewTreeRead {
  tree: ReviewTree;
  read: { runs: ReviewRunMeter[]; fault: string | null; denial: unknown };
}

/**
 * .what = parts each tree's read into the trees that were readable and the trees left unreadable
 * .why = every grove figure sums the readable trees alone, while each unreadable tree is
 *        named with its fault beside them — one split, so the two lists cannot disagree
 *        on which tree went where (rule.forbid.failhide)
 *
 * .note = `readable`, never `metered`: a readable tree carries runs of every grade, and
 *         `metered` is the name of one run grade (rule.forbid.domain-term-ambiguity)
 */
export const asTreeReadsSplit = (input: {
  reads: ReviewTreeRead[];
}): {
  readable: { tree: ReviewTree; runs: ReviewRunMeter[] }[];
  unreadable: { tree: string; fault: string }[];
} => ({
  readable: input.reads.flatMap((one) =>
    one.read.fault === null ? [{ tree: one.tree, runs: one.read.runs }] : [],
  ),
  unreadable: input.reads.flatMap((one) =>
    one.read.fault === null
      ? []
      : [{ tree: one.tree.name, fault: one.read.fault }],
  ),
});
