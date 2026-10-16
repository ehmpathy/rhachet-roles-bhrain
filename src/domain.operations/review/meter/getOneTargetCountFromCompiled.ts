import type { CompiledInputRows } from '@src/domain.objects/Reviewer/CompiledInputRows';
import type { PromptInputName } from '@src/domain.objects/Reviewer/PromptComposition';

/**
 * .what = which named inputs carry a TARGET, for the target count
 * .why = the twin of `SECTION_OF_INPUT` (in `getOnePromptSectionCharsFromCompiled`),
 *        for the `count` field rather than `chars`. the chars fold already
 *        composes the pull/push split — `targetPaths` folds into `targetFiles` —
 *        but the count did not, and read `targetFiles.count` alone. under
 *        `--focus pull` the renderer sends a path list, so `targetFiles.count`
 *        was `0` and every pull run dropped out of the target census.
 *
 *        a `Record` over the whole union, so a new `PromptInputName` forces this
 *        map to state whether it carries a target
 *        (rule.require.distinguish-every-review-input).
 */
export const IS_TARGET_COUNT_INPUT: Record<PromptInputName, boolean> = {
  // the two ways a target enters a prompt — a payload under `push`, a path under
  // `pull`. they are disjoint by construction, so a sum is never a double count
  targetFiles: true,
  targetPaths: true,
  // an addition and a deletion each ARE their target — neither has a file row
  'targetDiffs.additions': true,
  'targetDiffs.deletions': true,
  // a mutation accompanies a target its file row already counts; to count it again
  // would report one target twice
  'targetDiffs.mutations': false,
  rules: false,
  refs: false,
  conversation: false,
  instructions: false,
  outputFormat: false,
  markup: false,
};

/**
 * .what = reads how many TARGETS a compiled artifact's prompt carried
 * .why = the pull/push split folded, so the figure reads the same way at both
 *        foci: how many targets entered the prompt, by whichever route they took.
 */
export const getOneTargetCountFromCompiled = (input: {
  /** the `inputs` map as it comes off disk — one row per named input */
  rows: CompiledInputRows;
}): number =>
  Object.entries(IS_TARGET_COUNT_INPUT)
    .filter(([, carries]) => carries)
    .reduce((sum, [name]) => sum + (input.rows[name]?.count ?? 0), 0);
