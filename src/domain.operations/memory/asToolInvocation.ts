/**
 * .what = cast the PreToolUse stdin JSON into a tool invocation
 * .why = separates the pure cast from the guard orchestration, so memoryGuard
 *        composes leaf operations
 * .note = three outcomes:
 *   - a tool: a JSON object with a string `tool_name`
 *   - neither: empty stdin, a harness hiccup with no call to judge (silent allow)
 *   - a cause: a payload with bytes the guard cannot read as a call (malformed
 *     JSON, a non-object, no string `tool_name`); the call proceeds, but the guard
 *     names its blind spot, since a renamed harness field would else go dark
 */
export const asToolInvocation = (input: {
  raw: string;
}): {
  tool: {
    name: string;
    input: { file_path: string | null; command: string | null };
    cwd: string | null;
  } | null;
  unjudgeable: string | null;
} => {
  // empty stdin (harness hiccup) → no call to judge
  const raw = input.raw.trim();
  if (!raw) return { tool: null, unjudgeable: null };

  // parse; malformed JSON is a payload the guard cannot read; real errors rethrow
  const parsed = ((): { value: unknown } | null => {
    try {
      return { value: JSON.parse(raw) };
    } catch (error) {
      if (error instanceof SyntaxError) return null;
      throw error;
    }
  })();
  if (!parsed) return { tool: null, unjudgeable: 'tool payload is not json' };

  // a call needs an object with a string tool_name
  const payload = parsed.value;
  if (
    typeof payload !== 'object' ||
    payload === null ||
    Array.isArray(payload) ||
    !('tool_name' in payload) ||
    typeof payload.tool_name !== 'string'
  )
    return { tool: null, unjudgeable: 'tool payload has no tool_name' };

  // map absent claude tool fields (undefined) → null per internal contract
  const toolInput: { file_path?: unknown; command?: unknown } =
    'tool_input' in payload &&
    typeof payload.tool_input === 'object' &&
    payload.tool_input !== null
      ? payload.tool_input
      : {};
  return {
    tool: {
      name: payload.tool_name,
      input: {
        file_path:
          typeof toolInput.file_path === 'string' ? toolInput.file_path : null,
        command:
          typeof toolInput.command === 'string' ? toolInput.command : null,
      },
      // the shell's cwd, so a relative redirect is graded at the place it lands
      cwd:
        'cwd' in payload && typeof payload.cwd === 'string'
          ? payload.cwd
          : null,
    },
    unjudgeable: null,
  };
};
