import { isTargetPolluter } from '@src/domain.operations/isTargetPolluter';
// a declared exposure of review/ — see src/domain.operations/review/.readme.md
import { getAllTargetsAskedForByName } from '@src/domain.operations/review/getAllTargetsAskedForByName';

/**
 * .what = parts a scoped corpus into the targets a review keeps and the ones it drops
 *
 * .why = the two halves are complementary by construction — `kept` is exactly
 *        `targets \ dropped` — one pass decides the verdict, so the complement
 *        cannot drift the way two independent `filter` predicates could
 *        (rule.forbid.decode-friction-in-orchestrators)
 *
 * .note = `mode: 'keep'` drops naught, and answers `dropped: []` rather than
 *         a nil — the caller reads its length to decide whether to speak at
 *         all, so an absence would read "unknown" where the fact is "none"
 *         (rule.forbid.undefined-inputs)
 *
 * .note = a polluter a caller named by a specific `--paths` glob is their
 *         declared subject, so it is kept — `getAllTargetsAskedForByName`
 *         holds that argument
 *
 * .note = `askedForByName` rides in the return rather than stays private,
 *         because the caller writes it to `input.scope.debug.json` — a
 *         `.dream/` file that shows up in the scope looks like the filter
 *         failed, so the artifact names the exemption plainly
 *         (rule.forbid.failhide)
 *
 * .note = the by-name read is skipped under `mode: 'keep'`, since its only
 *         consumer is the drop predicate — a fast path, never a behavior
 *         difference
 */
export const getAllTargetsByPolluterVerdict = (input: {
  /** the corpus after scope, before the polluter verdict */
  targets: string[];
  /** the caller's positive `--paths` globs, which name an exemption */
  globs: string[];
  /** `drop` is the default the cli applies; `keep` opts the whole verdict out */
  mode: 'drop' | 'keep';
}): { kept: string[]; dropped: string[]; askedForByName: string[] } => {
  // with no drop asked for, the corpus passes through whole
  if (input.mode === 'keep')
    return { kept: input.targets, dropped: [], askedForByName: [] };

  const askedForByName = getAllTargetsAskedForByName({
    targets: input.targets,
    globs: input.globs,
  });

  // Sets, never `.includes` per item — a list scan is O(n·m) on the one corpus
  // a wide `--paths` makes large; `getAllTargetsJoined` already moved to a Set
  const askedForByNameSet = new Set(askedForByName);
  const dropped = input.targets.filter((target) =>
    isTargetDropped({ target, askedForByName: askedForByNameSet }),
  );
  const droppedSet = new Set(dropped);

  // the complement is computed from `dropped`, never a second predicate — two
  // predicates could disagree and land a target in neither half, or in both
  return {
    kept: input.targets.filter((target) => !droppedSet.has(target)),
    dropped,
    askedForByName,
  };
};

/**
 * .what = whether a target is dropped — a polluter the caller did not ask for by name
 * .why = a polluter named outright is the caller's choice, so only the unnamed ones drop
 */
const isTargetDropped = (input: {
  target: string;
  askedForByName: Set<string>;
}): boolean =>
  isTargetPolluter({ path: input.target }) &&
  !input.askedForByName.has(input.target);
