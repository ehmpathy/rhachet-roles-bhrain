/**
 * .what = renders a count with thousands separators — `1234567` → `1,234,567`
 * .why = a seven-digit char or token count is unreadable without them, and the cost
 *        reports are read by a human at a terminal. one render, so every surface
 *        groups its digits the same way (rule.forbid.duplicate-format-tree-operations)
 */
export const asCountHuman = (input: { of: number }): string =>
  input.of.toLocaleString('en-US');
