/**
 * .what = extracts JSON content from model response text
 * .why = model may wrap JSON in markdown code blocks, inline backticks, or prose
 */
export const extractJsonFromResultText = (input: {
  resultText: string;
}): string => {
  // try to extract from markdown code block first (case-insensitive for json/JSON/Json)
  const codeBlockMatch = input.resultText.match(
    /```(?:json)?\s*([\s\S]*?)```/i,
  );
  if (codeBlockMatch) {
    return codeBlockMatch[1]!.trim();
  }

  // try to find a JSON object within the text (handles prose + JSON at end)
  const jsonObjectMatch = input.resultText.match(/(\{[\s\S]*\})/);
  if (jsonObjectMatch) {
    // find the last valid JSON object (in case there are multiple or nested)
    const candidate = jsonObjectMatch[1]!.trim();
    try {
      JSON.parse(candidate);
      return candidate;
    } catch {
      // if the greedy match failed, try to find balanced braces
      const balanced = extractBalancedJson(input.resultText);
      if (balanced) return balanced;
    }
  }

  // try to find a JSON array within the text
  const jsonArrayMatch = input.resultText.match(/(\[[\s\S]*\])/);
  if (jsonArrayMatch) {
    const candidate = jsonArrayMatch[1]!.trim();
    try {
      JSON.parse(candidate);
      return candidate;
    } catch {
      // fall through to stripped version
    }
  }

  // strip inline backticks if present (model sometimes wraps JSON in single backticks)
  const stripped = input.resultText.trim().replace(/^`|`$/g, '');

  return stripped.trim();
};

/**
 * .what = extracts balanced JSON object from text via brace depth count
 * .why = greedy regex may capture too much; this finds valid JSON boundaries
 */
const extractBalancedJson = (text: string): string | null => {
  // find all positions where '{' appears
  const starts: number[] = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') starts.push(i);
  }

  // try each start position, search for valid JSON
  for (const start of starts.reverse()) {
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = start; i < text.length; i++) {
      const char = text[i];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === '\\' && inString) {
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (char === '{') depth++;
      if (char === '}') depth--;

      if (depth === 0) {
        const candidate = text.slice(start, i + 1);
        try {
          JSON.parse(candidate);
          return candidate;
        } catch {
          break;
        }
      }
    }
  }

  return null;
};
