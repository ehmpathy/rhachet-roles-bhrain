/**
 * .what = casts a scalar-or-array cli glob flag into a glob list
 * .why = six flags (`--paths`, `--paths-with`, `--paths-wout`, `--rules`, `--refs`,
 *        `--conversation`) each arrive as a scalar or an array; one decision
 *        named once beats six inline casts (rule.prefer.wet-over-dry)
 *
 * .note = the guard is truthiness, not a null check — `''` must drop. an
 *         empty-string glob that reaches `positivePathGlobs` would set
 *         `pathsRequested: true` and widen every lane's scope. a swap to
 *         `input.of === undefined` would alter behavior silently.
 */
export const asGlobList = (input: {
  of: string | string[] | undefined;
}): string[] => {
  if (!input.of) return [];
  return Array.isArray(input.of) ? input.of : [input.of];
};
