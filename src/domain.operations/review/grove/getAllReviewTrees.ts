import { BOUND_OF_CONCURRENT_DESCRIPTORS } from '@src/domain.operations/review/BOUND_OF_CONCURRENT_DESCRIPTORS';
import { getAllEntriesInDir } from '@src/domain.operations/review/getAllEntriesInDir';
import { getAllResultsInBoundedPool } from '@src/utils/getAllResultsInBoundedPool';

import { asReviewTreeDirs } from './asReviewTreeDirs';
import { getOneReviewTree } from './getOneReviewTree';

/**
 * how many `isPathPresent` probes may be in flight at once.
 *
 * 64, and the number is borrowed from the peer call site rather than invented:
 * `isPathPresent` wraps `fs.access`, which is the SAME descriptor/threadpool
 * subject `getAllTargetsTouchedAt`'s `fs.stat` bound was measured against. a
 * subject shared is a bound shared; what `getAllResultsInBoundedPool` refuses to share
 * is a bound across DIFFERENT subjects (its own note: heap earns 8, descriptors
 * earn 64), and these two are one subject.
 *
 * a grove root holds tens of worktrees, not the hundreds of targets that
 * bought the original bound — so this does not repair a measured failure. it
 * closes the gap that the abstraction was extracted to close and then missed at
 * its second obvious call site, which is the defect a reviewer named.
 */
const BOUND_OF_CONCURRENT_PROBES = BOUND_OF_CONCURRENT_DESCRIPTORS;

/**
 * .what = one tree on this machine that carries a review log root
 * .why = the unit the grove miner walks. a tree with no log root is not a defect —
 *        it simply never ran a review, and it is reported as such rather than dropped
 */
export interface ReviewTree {
  /** the tree's directory name (the worktree slug) */
  name: string;
  /** the absolute path to the tree */
  dir: string;
  /** the absolute path to its review log root */
  root: string;
  /** whether that root exists — a tree that never reviewed is a FACT, never a fault */
  present: boolean;
}

/**
 * .what = enumerates every tree under a root that could carry review logs
 * .why = the meter reads ONE tree, and its own note says a grove figure must be
 *        taken where the reviews ran. review logs are git-ignored ephemera, local to
 *        the machine — so they live scattered across worktrees, and no single tree
 *        can answer "where did the tokens go".
 *
 * .note = a tree with no `.log/bhrain/review` is reported with `present: false`
 *         rather than omitted. the count of trees that never reviewed is itself an
 *         answer — it says how much of the grove the sample covers
 *         (rule.forbid.failhide: an absent tree must not read as a metered zero).
 */
export const getAllReviewTrees = async (input: {
  root: string;
}): Promise<ReviewTree[]> => {
  // an ABSENT grove root answers an empty grove; an UNREADABLE one is a defect —
  // an empty grove renders a $0.00 total, so the two must never collapse
  const entries = await getAllEntriesInDir({ at: input.root });
  if (entries === null) return [];

  // the tree dirs, name-ordered
  const dirs = asReviewTreeDirs({ root: input.root, entries });

  // poured in bounded waves, never `Promise.all` over the whole grove. the
  // order is preserved by contract, so the name sort above survives
  return await getAllResultsInBoundedPool({
    items: dirs,
    bound: BOUND_OF_CONCURRENT_PROBES,
    map: getOneReviewTree,
  });
};
