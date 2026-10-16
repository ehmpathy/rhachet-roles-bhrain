import { isPathMatchedByGlob } from '@src/domain.operations/review/isPathMatchedByGlob';

/**
 * .what = keeps the targets that match NO exclusion glob
 *
 * .why = the orchestrator asked a reader to invert a nested `some` under a `!` to
 *        learn that the predicate KEEPS rather than drops. the name says it now, so
 *        the call site reads as narrative (rule.forbid.inline-decode-friction).
 *
 * .note = the exclusion set is the union of two spellings a caller may use — a `!`
 *         prefix on a `--paths` glob, and a `--paths-wout` glob. both arrive here
 *         already stripped to a bare glob, so this operation knows of only one kind.
 *
 * .note = an EMPTY exclusion set keeps every target, which is what `some` over an
 *         empty array already yields. it is stated rather than left to the reader,
 *         because the common invocation passes no exclusion at all.
 */
export const getAllTargetsScoped = (input: {
  /** the joined target set, before exclusions */
  targets: string[];
  /** the globs a target must match NONE of to survive */
  excluded: string[];
}): string[] =>
  input.targets.filter(
    (path) =>
      !input.excluded.some((glob) => isPathMatchedByGlob({ path, glob })),
  );
