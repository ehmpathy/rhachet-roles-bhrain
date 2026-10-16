/**
 * .what = how two requested target sources combine into one corpus
 * .why = `--diffs` and `--paths` each name a set of files. when a caller gives
 *        both, they mean either "only files in BOTH" or "files in EITHER"
 */
export type ReviewTargetJoin = 'intersect' | 'union';

/**
 * .what = joins the target files named by `--diffs` with those named by `--paths`
 * .why = the join turns on what was requested, never on what was found. a
 *        caller who passed no `--paths` at all and one whose `--paths` matched
 *        no file both yield `[]`, and they are opposites: the first asked for
 *        one source, so the diff set stands; the second asked to intersect
 *        with an empty set, so the corpus is empty. a fold of the two would
 *        silently review the whole diff under a glob that matched no file
 *        (rule.forbid.inline-decode-friction)
 */
export const getAllTargetsJoined = (input: {
  /** the files `--diffs` named; empty when the range held none */
  fromDiffs: string[];
  /** the files `--paths` named; empty when the globs matched none */
  fromPaths: string[];
  /** whether `--diffs` was asked for at all — NOT whether it found any file */
  diffsRequested: boolean;
  /** whether `--paths` was asked for at all — NOT whether it matched any file */
  pathsRequested: boolean;
  join: ReviewTargetJoin;
}): string[] => {
  // one source requested: the join has no second operand, so it does not apply
  if (!input.diffsRequested) return input.fromPaths;
  if (!input.pathsRequested) return input.fromDiffs;

  // both requested, intersect: only the files BOTH sources named
  if (input.join === 'intersect') {
    const pathsSet = new Set(input.fromPaths);
    return input.fromDiffs.filter((file) => pathsSet.has(file));
  }

  // both requested, union: every file EITHER source named, deduped
  return [...new Set([...input.fromDiffs, ...input.fromPaths])];
};
