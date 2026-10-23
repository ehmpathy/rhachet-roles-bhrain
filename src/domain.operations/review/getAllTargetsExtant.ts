/**
 * .what = keeps the targets that still have a body on disk
 *
 * .why = a DELETED target has no file to read, so a read of it would throw. the
 *        orchestrator held it out with an inline `filter` over a map lookup and a
 *        `!==`, which a reader had to simulate; the name states the rule
 *        (rule.forbid.inline-decode-friction).
 *
 * .note = a target ABSENT from the diff map is kept. that is deliberate: the map
 *         holds only what the diff range reported, so a target enumerated by
 *         `--paths` alone has no entry and is plainly present on disk. the check
 *         refutes on a KNOWN deletion rather than on an unknown state.
 *
 * .note = the dropped targets are not lost — the orchestrator re-joins them below as
 *         a void marker, so a deleted file still renders as one.
 */
export const getAllTargetsExtant = (input: {
  /** the target set, in the order the prompt will carry it */
  targets: string[];
  /** what the diff range reported per path, where it reported one */
  changeKindByPath: Map<string, { changeKind: string }>;
}): string[] =>
  input.targets.filter(
    (path) => input.changeKindByPath.get(path)?.changeKind !== 'deleted',
  );
