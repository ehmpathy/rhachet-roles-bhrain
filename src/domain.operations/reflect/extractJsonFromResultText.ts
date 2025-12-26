/**
 * .what = extracts JSON content from model response text
 * .why = model may wrap JSON in markdown code blocks or inline backticks
 */
export const extractJsonFromResultText = (input: {
  resultText: string;
}): string => {
  // try to extract from markdown code block first
  const codeBlockMatch = input.resultText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1]!.trim();
  }

  // strip inline backticks if present (model sometimes wraps JSON in single backticks)
  const stripped = input.resultText.trim().replace(/^`|`$/g, '');

  return stripped.trim();
};
