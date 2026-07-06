/**
 * .what = cast the PreToolUse stdin JSON into a tool invocation
 * .why = separates the pure cast (fail-open on empty/malformed) from the guard
 *        orchestration, so memoryGuard composes leaf operations
 * .note = the `tool` is null on empty or malformed stdin (both fail-open → allow)
 */
export const asToolInvocation = (input: {
  raw: string;
}): {
  tool: {
    name: string;
    input: { file_path: string | null; command: string | null };
  } | null;
} => {
  // empty stdin (harness hiccup) → fail-open
  const raw = input.raw.trim();
  if (!raw) return { tool: null };

  // parse; malformed JSON → fail-open, real errors rethrow
  try {
    const parsed = JSON.parse(raw);
    const toolInput = parsed.tool_input ?? {};
    return {
      tool: {
        name: parsed.tool_name ?? '',
        // map absent claude tool fields (undefined) → null per internal contract
        input: {
          file_path: toolInput.file_path ?? null,
          command: toolInput.command ?? null,
        },
      },
    };
  } catch (error) {
    if (error instanceof SyntaxError) return { tool: null };
    throw error;
  }
};
