import type { CompiledInputRows } from '@src/domain.objects/Reviewer/CompiledInputRows';
import type { PromptComposition } from '@src/domain.objects/Reviewer/PromptComposition';
import type { ReviewRunArgsRecord } from '@src/domain.objects/Reviewer/ReviewRunArgsRecord';

/**
 * .what = the payload `metrics.compiled.json` carries — what the prompt was made
 *         of, counted off the rendered bytes before the brain is called
 *
 * .why = a shared declaration for the write side (`setInputArtifacts`) and the read
 *        side (`getOneReviewRunMeter`). the reader once hand-typed its own
 *        `prompt?: { chars?; attribution? }`, so a rename of the writer's key
 *        compiled on both sides, and the reader returned `attribution: null` —
 *        which reads as "the run predates the grade": a fresh run graded as legacy
 *
 * .note = the peer of `ReviewRunArgsRecord` and `ReviewRunMetricsRealized`, one per
 *         artifact. there is deliberately no `estimate` key: this file is the
 *         MEASURED half of the record, and `metrics.expected.json` owns the estimate
 */
export interface ReviewRunMetricsCompiled {
  prompt: {
    chars: PromptComposition['chars'];
    cacheable: PromptComposition['cacheable'];
    attribution: PromptComposition['attribution'];
  };
  inputs: PromptComposition['inputs'];
  /**
   * where the TARGET mass came from — one entry per target path, with its chars
   *
   * .why = `inputs` names the KIND of input and never the PLACE. this row lets the
   *        tree and grove breadths name a directory to prune from kilobytes, with
   *        no re-read of a megabyte prompt per run
   *        (rule.require.report-both-cost-levers-with-trend-and-locus).
   *
   * .note = `null` where the walk could not read the prompt it was handed; `[]` where
   *         it read and found no per-target mass (a `--focus pull` render)
   */
  locus: { path: string; chars: number }[] | null;
  scope: { rules: number; refs: number; conversation: number; targets: number };
  args: Pick<ReviewRunArgsRecord['args'], 'focus' | 'goal'>;
}

/**
 * .what = the shape a reader may assume of a `metrics.compiled.json` off disk
 * .why = every level may be absent on an older file, and every field name still
 *        comes from the one declaration above, so a rename fails the reader too
 *
 * .note = `inputs` reads through `CompiledInputRows`, since the row SET drifts
 *         across versions — a run on disk may predate an input, or name one since
 *         retired — and the readers grade that absence rather than assume it
 */
export type ReviewRunMetricsCompiledRead = {
  prompt?: Partial<ReviewRunMetricsCompiled['prompt']>;
  inputs?: CompiledInputRows;
  /** absent on every run compiled before the row existed — read as UNREAD, never `[]` */
  locus?: unknown;
  scope?: Partial<ReviewRunMetricsCompiled['scope']>;
  args?: Partial<ReviewRunMetricsCompiled['args']>;
};
