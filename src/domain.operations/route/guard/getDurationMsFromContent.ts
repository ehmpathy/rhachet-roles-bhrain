/**
 * .what = extracts the review duration in milliseconds from review content
 * .why = encapsulates regex extraction so the orchestrator reads as narrative
 *
 * format: "└─ total: 51455ms" under metrics.realized > time.
 * returns null when no duration line is present.
 */
export const getDurationMsFromContent = (input: {
  content: string;
}): number | null => {
  const durationMatch = input.content.match(/total:\s*(\d+)ms/i);
  return durationMatch?.[1] ? parseInt(durationMatch[1], 10) : null;
};
