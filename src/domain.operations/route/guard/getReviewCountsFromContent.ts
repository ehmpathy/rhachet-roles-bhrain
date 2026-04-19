/**
 * .what = extracts blocker and nitpick counts from review content
 * .why = encapsulates regex extraction for readability
 */
export const getReviewCountsFromContent = (input: {
  content: string;
}): { blockers: number; nitpicks: number } => {
  // match both formats:
  // 1. "blockers: N" (yaml/key-value format from review tools)
  // 2. "N blockers" (tree/prose format from skill output)
  const blockerMatch =
    input.content.match(/blockers?:\s*(\d+)/i) ||
    input.content.match(/(\d+)\s+blockers?/i);
  const nitpickMatch =
    input.content.match(/nitpicks?:\s*(\d+)/i) ||
    input.content.match(/(\d+)\s+nitpicks?/i);

  return {
    blockers: blockerMatch?.[1] ? parseInt(blockerMatch[1], 10) : 0,
    nitpicks: nitpickMatch?.[1] ? parseInt(nitpickMatch[1], 10) : 0,
  };
};
