import * as fs from 'fs/promises';

import type { PromptComposition } from '@src/domain.objects/Reviewer/PromptComposition';
import type { ReviewRunArgsRecord } from '@src/domain.objects/Reviewer/ReviewRunArgsRecord';
import type { ReviewRunMetricsCompiled } from '@src/domain.objects/Reviewer/ReviewRunMetricsCompiled';
import { asPromptSectionChars } from '@src/domain.operations/review/asPromptSectionChars';
import { asRunArtifactPath } from '@src/domain.operations/review/asRunArtifactPath';

/**
 * .what = writes input artifacts to log directory for auditability
 * .why = enables diagnosis, replay, and audit of review invocations
 */
export const setInputArtifacts = async (input: {
  logDir: string;
  /**
   * where this prompt's chars went, by named input.
   *
   * 🔴 written HERE, at compile time, never only beside the realized metrics. a
   * run that compiled a prompt and then died — the `unknown` grade — would
   * otherwise leave its composition unrecorded, and the only way back to it is
   * to re-parse a megabyte of rendered prompt.
   */
  composition: PromptComposition;
  args: ReviewRunArgsRecord['args'];
  scope: ReviewRunArgsRecord['scope'];
  metrics: ReviewRunArgsRecord['metrics'];
  prompt: string;
}): Promise<{
  argsPath: string;
  promptPath: string;
  compiledPath: string;
}> => {
  // ensure log directory exists
  await fs.mkdir(input.logDir, { recursive: true });

  // write input.args.json
  const argsPath = asRunArtifactPath({ dir: input.logDir, artifact: 'args' });
  const argsRecord: ReviewRunArgsRecord = {
    args: input.args,
    scope: input.scope,
    metrics: input.metrics,
  };
  const argsContent = JSON.stringify(argsRecord, null, 2);
  await fs.writeFile(argsPath, argsContent, 'utf-8');

  // write input.prompt.md
  const promptPath = asRunArtifactPath({
    dir: input.logDir,
    artifact: 'prompt',
  });
  await fs.writeFile(promptPath, input.prompt, 'utf-8');

  /**
   * write metrics.compiled.json — the durable, machine-readable stats artifact
   *
   * 🔴 this is what a corpus study reads. it is small and fixed-size, where the
   * prompt beside it runs to megabytes — measured: a grove mine that re-parsed
   * the prompts read ~2.8gb and died at a 2gb heap limit, to recover figures
   * that were knowable at compile time and never change.
   *
   * .note = every figure here is knowable BEFORE the brain is called, which is
   *         why it is a peer of `metrics.realized.json` rather than a field
   *         inside it. realized holds what only the call can say (tokens, spend,
   *         time); compiled holds what only the prompt can say.
   */
  const compiledPath = asRunArtifactPath({
    dir: input.logDir,
    artifact: 'compiled',
  });
  const compiledRecord: ReviewRunMetricsCompiled = {
    prompt: {
      chars: input.composition.chars,
      cacheable: input.composition.cacheable,
      /**
       * 🔴 the census's own verdict on its coverage, persisted beside the
       * rows it qualifies. a corpus study that sums `scaffold` across runs
       * must be able to ask how many of those runs the census could not
       * vouch for — the same honesty the cost grade already carries
       * (`getOneAccountedCost`), for the other half of the record.
       */
      attribution: input.composition.attribution,
    },
    /**
     * 🔴 one row per named input, each with its mass, its file count, and
     * which side of the cache seam it sat on. every input the prompt was
     * built from is owed a row here
     * (rule.require.distinguish-every-review-input).
     *
     * .note = the rows sum to `prompt.chars`, which proves the arithmetic
     *         and not the coverage — `markup` is the residual, so it absorbs
     *         an unnamed input with the sum still exact. `prompt.attribution`
     *         above is what speaks to coverage.
     */
    inputs: input.composition.inputs,
    /**
     * 🔴 where the target mass came from, per path — off the SAME walk the parse
     * lane runs (`asPromptSectionChars`), so a compiled run and a parsed run place
     * one prompt's mass identically. the prompt is already in memory here, so the
     * walk costs one pass; a reader later pays kilobytes rather than a megabyte
     * per run (rule.require.report-both-cost-levers-with-trend-and-locus)
     */
    locus: asPromptSectionChars({ prompt: input.prompt })?.locus ?? null,
    /**
     * 🔴 there is deliberately NO `estimate` key here, and its absence is
     * the point. this file is the MEASURED half of the record — `prompt`,
     * `inputs`, and `attribution` are each counted off the rendered bytes.
     * an `estimate` triple rode here under a bare key, with no grade beside
     * it and no mark to part it from the counted rows.
     *
     * .why = `getOneReviewRunMeter` promises *"no estimate can ever enter a
     *        reported figure"* — and it READS this file. that promise held
     *        only because its cast happened to omit the key, so the next
     *        reader to widen the cast would have broken it silently. the
     *        estimate is gone, so the guarantee is now structural.
     *
     * .note = it is not lost. `metrics.expected.json` owns these three
     *         figures, is NAMED for them, and renders them to a human under
     *         a `🔭 projection` header (`genReviewInputStdout`). they also
     *         ride in `input.args.json` above, as part of the replay record
     *         of the invocation rather than as a measurement of it.
     */
    scope: {
      rules: input.scope.ruleFiles.length,
      refs: input.scope.refFiles.length,
      conversation: input.scope.conversationFiles.length,
      targets: input.scope.targetFiles.length,
    },
    args: { focus: input.args.focus, goal: input.args.goal },
  };
  await fs.writeFile(
    compiledPath,
    JSON.stringify(compiledRecord, null, 2),
    'utf-8',
  );

  return { argsPath, promptPath, compiledPath };
};
