import { enumRouteFiles } from '../../artifact/enumRouteFiles';
import { asStoneGuardCounter } from '../../asStoneGuardCounter';
import { enumRouteGuardReviewPeerFiles } from './enumRouteGuardReviewPeerFiles';

/**
 * .what = enumerates the full peer-review conversation for a stone — every
 *         .given.by_peer (summary + detailed .report) + .taken.by_self across
 *         PRIOR generations
 * .why = ONE shared expander feeds both the guard $conversation var and the
 *        review --conversation flag, so the two paths cannot drift (R4)
 *
 * excludes the current {iteration, hash} generation when `exclude` is supplied,
 * so a later reviewer in the SAME guard run never sees an earlier reviewer's
 * brand-new, still-unanswered given (no .taken can exist for it yet).
 *
 * the .report.md files are ALWAYS part of the conversation: the summary
 * .given.by_peer.md holds only the verdict counts, while the paired .report.md
 * carries the DETAILED prior critique (locations + snippets + rule cites). a
 * reviewer must see its full prior critique to judge convergence, so the reports
 * are enumerated here directly — the gate enumerator keeps its own report
 * exclusion (it pairs given↔taken by the summary file), so the report inclusion
 * lives on THIS conversation path, not on the shared enumerator.
 */
export const enumRouteGuardReviewPeerConversationFiles = async (input: {
  route: string;
  stone: string;
  exclude?: { iteration: number; hash: string };
}): Promise<string[]> => {
  // union all three sides: given summaries, given detail reports, taken responses
  const [givens, reports, takens] = await Promise.all([
    enumRouteGuardReviewPeerFiles({
      route: input.route,
      stone: input.stone,
      kind: 'given',
    }),
    enumRouteFiles({
      route: input.route,
      glob: `.reviews/peer/${input.stone}._.review.i*.*.r*._.given.by_peer.*.report.md`,
    }),
    enumRouteGuardReviewPeerFiles({
      route: input.route,
      stone: input.stone,
      kind: 'taken',
    }),
  ]);
  const files = [...givens, ...reports, ...takens];

  // plain lexical sort suffices: i/r counters are zero-padded (asStoneGuardCounter)
  // so lexical order equals numeric order — rounds stay round-major (i-segment),
  // reviewers index-major (r-segment), and given → report → taken within each
  // reviewer (the tail: given < taken, and .md < .report.md)
  if (!input.exclude) return files.sort();

  // drop the entire current generation so only settled prior dialogue is seen
  const iSeg = asStoneGuardCounter({ value: input.exclude.iteration });
  const infixCurrent = `._.review.i${iSeg}.${input.exclude.hash}.`;
  return files.filter((file) => !file.includes(infixCurrent)).sort();
};
