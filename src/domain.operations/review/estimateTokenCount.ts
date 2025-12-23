/**
 * .what = estimates the token count of a string using a heuristic
 * .why = enables context window calculations without external dependencies
 *
 * .note = uses ~4 chars per token heuristic which aligns with typical LLM tokenizers
 */
export const estimateTokenCount = (input: { content: string }): number => {
  // handle empty content
  if (!input.content) return 0;

  // estimate tokens using chars/4 heuristic (common for english text + code)
  const charCount = input.content.length;
  const estimatedTokens = Math.ceil(charCount / 4);

  return estimatedTokens;
};
