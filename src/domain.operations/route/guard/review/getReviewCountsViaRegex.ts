/**
 * .what = the tally a review declares — a discriminated union over whether a verdict was found
 * .why = the `{ detected: false }` branch carries NO count fields, so a caller cannot read a
 *        fake `0/0` from an absent verdict. this makes rule.forbid.failhide a compile error at
 *        the measurement boundary, not a convention. see contract.reviewer-output.
 *
 * a leaf tactic returns this shape; it does not know it sits in a cascade, so it carries no
 * `tactic` field. the orchestrator (getReviewCounts) stamps the tactic on the true branch.
 */
export type ReviewCounts =
  | { detected: false }
  | { detected: true; blockers: number; nitpicks: number };

/**
 * .what = a resolved tally, stamped with WHICH tactic yielded it
 * .why = the orchestrator waterfalls two tactics; the `tactic` field lets a human/test see
 *        whether the count was read verbatim (deterministic) or extracted by the sub-brain
 *        (probabilistic). only the true branch carries it — absence has no tactic to name.
 */
export type ReviewCountsResolved =
  | { detected: false }
  | {
      detected: true;
      blockers: number;
      nitpicks: number;
      tactic: 'deterministic' | 'probabilistic';
    };

/**
 * .what = extracts the last numeric count for a single dimension from review content
 * .why = the authoritative count is the reviewer's final declaration (typically the summary),
 *        so we take the LAST occurrence — a first-match would be fooled by incidental prose
 *        like "i reviewed the 3 blockers from last round. 0 blockers remain." (grabs 3, not 0).
 *
 * matches both numeric forms in one pass, in document order:
 *   1. "blockers: N" (yaml/key-value form from review tools)
 *   2. "N blockers"  (tree/prose form from skill output)
 * returns undefined when the dimension carries no numeric declaration.
 */
const getLastCountForDimension = (input: {
  content: string;
  stem: 'blocker' | 'nitpick';
}): number | undefined => {
  // .note = the "N word" form uses same-line whitespace ([ \t]+, not \s+) so a number on a
  //         prior line cannot bind to a word on the next (e.g. "blockers: 3\nnitpicks: 5"
  //         must not read "3 nitpicks"). count declarations are always single-line.
  const pattern = new RegExp(
    `${input.stem}s?:\\s*(\\d+)|(\\d+)[ \\t]+${input.stem}s?`,
    'gi',
  );
  const matches = [...input.content.matchAll(pattern)];
  const lastMatch = matches.at(-1);
  const value = lastMatch ? (lastMatch[1] ?? lastMatch[2]) : undefined;
  return value !== undefined ? parseInt(value, 10) : undefined;
};

/**
 * .what = deterministic tactic — extracts blocker/nitpick counts from review content via regex
 * .why = when a reviewer states its verdict as numbers (`0 blockers`, `2 nitpicks`), this reads
 *        them verbatim, free and exact. it is the first tactic in the getReviewCounts cascade;
 *        getReviewCountsViaBrain is its probabilistic peer for prose verdicts.
 *
 * .detected = only true when BOTH dimensions carry an explicit numeric count. when a dimension
 *   has no number, returns { detected: false } — the caller must NOT treat absence as zero.
 *   see rule.forbid.failhide + contract.reviewer-output. numbers-only by design: word-forms
 *   like "none"/"no blockers" do NOT count.
 */
export const getReviewCountsViaRegex = (input: {
  content: string;
}): ReviewCounts => {
  const blockerCount = getLastCountForDimension({
    content: input.content,
    stem: 'blocker',
  });
  const nitpickCount = getLastCountForDimension({
    content: input.content,
    stem: 'nitpick',
  });

  // absent verdict when either dimension lacks a number — carry no counts to fake
  if (blockerCount === undefined || nitpickCount === undefined)
    return { detected: false };

  return { detected: true, blockers: blockerCount, nitpicks: nitpickCount };
};
