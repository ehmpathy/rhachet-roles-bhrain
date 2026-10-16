/**
 * .what = the values a scope flag was actually given — `--rules`, `--diffs`, `--paths` —
 *         with empty members dropped
 * .why = one home for the question "was this flag given at all?". the flag render
 *        (`asScopeFlagHuman`) and the count rows beside it on one refusal tree must
 *        judge emptiness alike, or an empty-but-defined flag renders `(none)` on one
 *        line and a measured zero on the next (rule.forbid.friction-hazards)
 *
 * .note = emptiness is judged on the values, never on the container — `[]` is
 *         truthy, and `''` from an unset shell var is a defined value that names
 *         no glob, so a container-only guard reads both as present
 */
export const getAllScopeFlagValues = (input: {
  of: string | string[] | undefined;
}): string[] =>
  (Array.isArray(input.of) ? input.of : [input.of]).filter(
    (value): value is string => !!value,
  );
