import { asGlobList } from './asGlobList';

/**
 * .what = casts the three path flags into one positive/negative glob pair
 * .why = `--paths` carries both senses via a `!` prefix, while `--paths-with`
 *        and `--paths-wout` each carry one. one named operation states the
 *        split, rather than a filter/negation/slice inlined in an
 *        orchestrator (`rule.forbid.inline-decode-friction`).
 *
 * .note = five sites downstream read one of these two lists —
 *         `enumFilesForReviewSubjects`, `getAllTargetsJoined`'s
 *         `pathsRequested`, the negative-glob filter,
 *         `getAllTargetsAskedForByName`, and the scope debug record. so a
 *         defect here presents as a scope defect far from its cause: a lane
 *         reviews the wrong files and still returns a well-formed verdict.
 */
export const asTargetPathGlobs = (input: {
  paths: string | string[] | undefined;
  pathsWith: string | string[] | undefined;
  pathsWout: string | string[] | undefined;
}): { positive: string[]; negative: string[] } => {
  // `--paths` is the two-sense flag: a `!` prefix marks an exclusion
  const globsOfPaths = asGlobList({ of: input.paths });
  const globsOfPathsExcluded = globsOfPaths.filter((glob) =>
    glob.startsWith('!'),
  );
  const globsOfPathsIncluded = globsOfPaths.filter(
    (glob) => !glob.startsWith('!'),
  );

  return {
    positive: [...globsOfPathsIncluded, ...asGlobList({ of: input.pathsWith })],

    // the `!` is the MARKER, never part of the glob — strip it before it
    // reaches an enumerator, which would read `!` as a literal path char
    negative: [
      ...globsOfPathsExcluded.map((glob) => glob.slice(1)),
      ...asGlobList({ of: input.pathsWout }),
    ],
  };
};
