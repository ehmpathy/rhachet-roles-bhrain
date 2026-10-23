import type { CompiledInputRows } from '@src/domain.objects/Reviewer/CompiledInputRows';
import type { PromptInputName } from '@src/domain.objects/Reviewer/PromptComposition';
import {
  type PromptSectionChars,
  SECTIONS_NIL,
} from '@src/domain.objects/Reviewer/PromptSectionChars';
import { ReviewRunArtifactError } from '@src/domain.operations/review/ReviewRunArtifactError';

/**
 * .what = which census row each named prompt input folds into
 * .why = the compiled artifact names more inputs than this census carries rows,
 *        since the coarse reader — a re-parse of the rendered prompt — cannot part
 *        a pull render's path list from file bodies. so the fine rows fold, and
 *        this map is the one place they fold.
 *
 *        a `Record` over the whole union on purpose: a new `PromptInputName`
 *        goes red at compile time until it names the row it feeds, so an input
 *        cannot be measured, written to disk, and dropped silently on its way
 *        into the census (rule.require.distinguish-every-review-input,
 *        obligation 3).
 *
 * .note = a residual fold was rejected: to define `scaffold` as
 *         `chars - (the five named)` would keep the sum exact while it
 *         absorbed an unmapped input into a row labelled render overhead — the
 *         precise failure this rule forbids, one layer down. a compile error
 *         is the honest alternative, and costs naught at runtime.
 */
export const SECTION_OF_INPUT: Record<
  PromptInputName,
  keyof PromptSectionChars
> = {
  rules: 'rules',
  refs: 'refs',
  conversation: 'conversation',
  'targetDiffs.additions': 'targetDiffs.additions',
  'targetDiffs.deletions': 'targetDiffs.deletions',
  'targetDiffs.mutations': 'targetDiffs.mutations',
  targetFiles: 'targetFiles',
  // a `pull` render's path list folds into `targetFiles`, never `scaffold` —
  // it is how the targets entered the prompt, and to fold it into render
  // overhead would report a pull review as all-scaffold and no targets
  targetPaths: 'targetFiles',
  instructions: 'instructions',
  outputFormat: 'outputFormat',
  markup: 'scaffold',
};

/**
 * .what = the rows an OLDER compiler wrote, and the census row each one folds into
 * .why = an artifact on disk is archaeology, and a run compiled before additions moved
 *        into the diff group carries one `targetDiffs` row. that row held only the
 *        hunks of edited files — a new file then sent its body under `targetFiles`,
 *        and a deletion a file-group tag — so it IS `targetDiffs.mutations`, exactly.
 *        to drop it would break the sum check on every such run; to guess a split
 *        would invent one
 */
const SECTION_OF_LEGACY_INPUT: Record<string, keyof PromptSectionChars> = {
  targetDiffs: 'targetDiffs.mutations',
};

/**
 * .what = folds a compiled artifact's fine input rows into the coarse census rows
 * .why = the compiled lane's reader. `metrics.compiled.json` is measured at compile
 *        time from the source arrays, so it is exact and kilobytes; the census it
 *        feeds is shared with the parsed lane, which is coarser. this is the cast
 *        between the two vocabularies.
 *
 * .note = the sum check below is a real detector, unlike the one inside the
 *         composition it reads. there, `markup` is the residual, so the rows
 *         sum to `chars` by algebra and the assertion proves naught about
 *         coverage. here every row is a sum of named source rows, so an
 *         unmapped row, or an artifact hand-edited out of true, makes the sum
 *         disagree — the one layer where that invariant earns its keep.
 */
export const getOnePromptSectionCharsFromCompiled = (input: {
  /** the `inputs` map as it comes off disk — one row per named input */
  rows: CompiledInputRows;
  /** the `prompt.chars` the artifact states for itself */
  chars: number;
  /** the log dir, for a loud error */
  dir: string;
}): PromptSectionChars => {
  const sections = getOneSectionsFromRows({ rows: input.rows });
  const summed = getOneSectionsSum({ sections });

  // a compiled artifact whose rows do not sum to its own stated total is malformed.
  // it must fail loud rather than under-report a census as though it were whole
  // (rule.forbid.failhide — a corrupt artifact must never read as a valid one)
  if (summed !== input.chars)
    throw new ReviewRunArtifactError(
      'metrics.compiled.json rows do not sum to its own prompt.chars',
      {
        dir: input.dir,
        summed,
        stated: input.chars,
        residual: input.chars - summed,
        rowsFound: Object.keys(input.rows),
        rowsMapped: Object.keys(SECTION_OF_INPUT),
      },
    );

  return sections;
};

/**
 * .what = folds the fine input rows onto the coarse census rows
 * .why = several rows land on one key, so the accumulator must carry what
 *        earlier rows already put there — `targetPaths` lands on `targetFiles`,
 *        and a legacy `targetDiffs` lands on `targetDiffs.mutations` — so the
 *        seed is read back (`acc[into] + …`) rather than merely written
 */
const getOneSectionsFromRows = (input: {
  rows: CompiledInputRows;
}): PromptSectionChars =>
  [
    ...Object.entries(SECTION_OF_INPUT),
    ...Object.entries(SECTION_OF_LEGACY_INPUT),
  ].reduce<PromptSectionChars>(
    (acc, [name, into]) => ({
      ...acc,
      [into]: acc[into] + (input.rows[name]?.chars ?? 0),
    }),
    { ...SECTIONS_NIL },
  );

/**
 * .what = the total chars the census rows carry
 */
const getOneSectionsSum = (input: { sections: PromptSectionChars }): number =>
  Object.values(input.sections).reduce((sum, one) => sum + one, 0);
