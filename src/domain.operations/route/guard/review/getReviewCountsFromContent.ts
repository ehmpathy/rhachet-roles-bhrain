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
 * .what = extracts blocker and nitpick counts from review content
 * .why = encapsulates regex extraction for readability
 *
 * .detected = whether BOTH dimensions carry an explicit numeric count.
 *   a reviewer must state a number for each (e.g. `0 blockers`, `2 nitpicks`).
 *   when a dimension has no numeric count, detected = false — the caller must NOT
 *   treat an absent count as zero. see rule.forbid.failhide + contract.reviewer-output.
 *   numbers-only by design: word-forms like "none"/"no blockers" do NOT count.
 */
export const getReviewCountsFromContent = (input: {
  content: string;
}): { detected: boolean; blockers: number; nitpicks: number } => {
  const blockerCount = getLastCountForDimension({
    content: input.content,
    stem: 'blocker',
  });
  const nitpickCount = getLastCountForDimension({
    content: input.content,
    stem: 'nitpick',
  });

  // detected only when both dimensions declared a number
  const detected = blockerCount !== undefined && nitpickCount !== undefined;

  return {
    detected,
    blockers: blockerCount ?? 0,
    nitpicks: nitpickCount ?? 0,
  };
};
