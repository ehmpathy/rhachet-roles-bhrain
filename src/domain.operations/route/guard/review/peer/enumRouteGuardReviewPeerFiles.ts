import { enumRouteFiles } from '../../artifact/enumRouteFiles';
import { asStoneGuardCounter } from '../../asStoneGuardCounter';

/**
 * .what = enumerates peer review guard files by semantic criteria
 * .why = centralizes glob pattern construction for peer reviews
 *
 * kind selects the authored side of the conversation:
 * - 'given' (default) → the reviewer's critique: ._.given.by_peer.$slug.md
 * - 'taken'           → the driver's response:  ._.taken.by_self.$slug.md
 *
 * filename pattern: .reviews/peer/$stone._.review.i$iter.$hash.r$idx.$infix.$slug.md
 *
 * .note = the *.md glob would also match the adjacent ._..$slug.report.md file,
 *         so *.report.md is excluded explicitly. the gate pairs given↔taken by
 *         the summary file, so a .report.md must NOT count as a separate given.
 *         (the conversation expander enumerates reports on its own path.)
 */
export const enumRouteGuardReviewPeerFiles = async (input: {
  route: string;
  stone: string;
  kind?: 'given' | 'taken';
  iteration?: number;
  hash?: string;
  index?: number;
}): Promise<string[]> => {
  // pick the conversation-side infix; given is the default for extant callers
  const infix =
    input.kind === 'taken' ? '_.taken.by_self.' : '_.given.by_peer.';

  // construct glob from semantic inputs
  // .note = i/r counters are zero-padded (asStoneGuardCounter) so an exact-match
  //         segment aligns with the written filename; wildcards (i*, r*) match
  //         padded segments unchanged
  let glob = `.reviews/peer/${input.stone}._.review.`;
  glob +=
    input.iteration !== undefined
      ? `i${asStoneGuardCounter({ value: input.iteration })}.`
      : 'i*.';
  glob += input.hash ? `${input.hash}.` : '*.';
  glob +=
    input.index !== undefined
      ? `r${asStoneGuardCounter({ value: input.index })}.`
      : 'r*.';
  glob += `${infix}*.md`;

  return enumRouteFiles({
    route: input.route,
    glob,
    ignore: ['**/*.report.md'],
  });
};
